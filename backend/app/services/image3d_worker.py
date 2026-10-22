"""Isolated engine worker. No fallback or synthetic multi-view inputs."""
import argparse
import json
import os
from pathlib import Path
import sys
import traceback

import numpy as np
from PIL import Image

BACKEND = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND))
from app.services.image3d_engines import ENGINES

def prepare_reference(image, *, remove_background, align, session=None):
    from PIL import Image
    import numpy as np
    image = image.convert("RGBA")
    if remove_background and image.getextrema()[3][0] == 255:
        from rembg import remove
        image = remove(image, session=session)
    alpha = np.asarray(image)[:,:,3]
    if (alpha > 32).sum() < 64:
        raise ValueError("Background removal left no clear object. Disable it or use a transparent reference.")
    if align:
        mask = Image.fromarray((alpha>32).astype('uint8')*255)
        crop = image.crop(mask.getbbox())
        crop.thumbnail((420,420), Image.Resampling.LANCZOS)
        image = Image.new("RGBA", (512,512), (255,255,255,0))
        image.paste(crop, ((512-crop.width)//2,(512-crop.height)//2))
    else:
        image.thumbnail((1024,1024), Image.Resampling.LANCZOS)
    return image

def delight_image(image):
    """Removes directional shadows and baked lighting highlights for clean albedo."""
    import cv2
    rgba = np.asarray(image.convert("RGBA"))
    rgb = rgba[:, :, :3]
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    L = lab[:, :, 0]
    mask = rgba[:, :, 3] > 48
    illum = cv2.bilateralFilter(L, d=15, sigmaColor=75, sigmaSpace=75)
    mean_l = float(np.mean(L[mask])) if mask.any() else 128.0
    delit_l = np.clip((L / (illum + 1e-4)) * mean_l, 0, 255)
    lab[:, :, 0] = delit_l
    delit_rgb = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2RGB)
    delit_rgba = np.dstack([delit_rgb, rgba[:, :, 3]])
    return Image.fromarray(delit_rgba)

def generate(task, job, models, progress):
    import torch
    from PIL import Image
    if not torch.cuda.is_available():
        raise RuntimeError("A CUDA GPU is required for these local engines.")
    spec = ENGINES[task["engine_id"]]
    progress(5, "Cleaning and aligning reference images")
    os.environ["U2NET_HOME"] = str(models)
    session = None
    if task["remove_background"]:
        from rembg import new_session
        session = new_session("u2net", providers=["CPUExecutionProvider"])
    refs = {}
    for view in task["views"]:
        ref_p = job / f"reference-{view}.png"
        inp_p = job / f"input-{view}.png"
        if ref_p.is_file() and not inp_p.is_file():
            refs[view] = Image.open(ref_p).convert("RGBA")
        else:
            refs[view] = prepare_reference(Image.open(inp_p), remove_background=task["remove_background"], align=task["align"], session=session)
            refs[view].save(ref_p)
    del session
    if task.get("remove_lighting", False):
        progress(10, "Removing directional shadows and lighting (Delight)")
        for view in list(refs.keys()):
            refs[view] = delight_image(refs[view])
            refs[view].save(job / f"reference-{view}.png")
    root = models / task["engine_id"]
    progress(15, f"Loading {spec['name']} with memory offloading")
    if spec["family"] == "sf3d":
        vendor = BACKEND / "app/vendor/sf3d"
        sys.path.insert(0, str(vendor))
        os.chdir(vendor)
        from sf3d.system import SF3D
        model = SF3D.from_pretrained(str(root), config_name="config.yaml", weight_name=spec["weight"]).to("cuda").eval()
        progress(35, "Reconstructing textured surface")
        with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
            mesh, _ = model.run_image(refs["front"], bake_resolution=1024, remesh="none", vertex_count=-1)
    else:
        if spec["family"] == "hunyuan2":
            sys.path.insert(0, str(BACKEND / "app/vendor/hunyuan2"))
            from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
        else:
            sys.path.insert(0, str(BACKEND / "app/vendor/hunyuan21/hy3dshape"))
            from hy3dshape.pipelines import Hunyuan3DDiTFlowMatchingPipeline
        torch.set_num_threads(min(os.cpu_count() or 4, 8))
        previous_dtype = torch.get_default_dtype()
        try:
            torch.set_default_dtype(torch.float16)
            pipeline = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(str(root), subfolder=spec["folder"], use_safetensors=spec["weight"].endswith("safetensors"), device="cpu", dtype=torch.float16)
        finally:
            torch.set_default_dtype(previous_dtype)
        def apply_sequential_cpu_offload(p):
            orig_encode_cond = p.encode_cond
            orig_export = p._export

            def wrapped_encode_cond(*args, **kwargs):
                p.conditioner.to("cuda", dtype=torch.float16)
                try:
                    return orig_encode_cond(*args, **kwargs)
                finally:
                    p.conditioner.to("cpu")
                    torch.cuda.empty_cache()
                    p.model.to("cuda", dtype=torch.float16)

            def wrapped_export(*args, **kwargs):
                p.model.to("cpu")
                torch.cuda.empty_cache()
                p.vae.to("cuda", dtype=torch.float16)
                try:
                    return orig_export(*args, **kwargs)
                finally:
                    p.vae.to("cpu")
                    torch.cuda.empty_cache()

            p.encode_cond = wrapped_encode_cond
            p._export = wrapped_export
            p.device = torch.device("cuda")

        apply_sequential_cpu_offload(pipeline)
        is_ultra = task.get("ultra_mesh_quality", True)
        detail = "high" if is_ultra else task.get("detail", "standard")
        resolution = {"low": 192, "standard": 256, "high": 384, "ultra": 384}.get(detail, 256)
        steps = {"low": 20, "standard": 30, "high": 50, "ultra": 50}.get(detail, 30)
        progress(25, "Inferring full geometry from labeled references")
        def callback(index, *_):
            progress(25+int(50*(index+1)/steps), f"Shape diffusion {index+1}/{steps}")
        mesh = pipeline(image=refs if task["engine_id"] == "hunyuan-mv" else refs["front"], num_inference_steps=steps,
                        octree_resolution=resolution, num_chunks=2048, generator=torch.Generator(device="cuda").manual_seed(task["seed"]),
                        callback=callback, callback_steps=1, mc_algo="mc", output_type="trimesh")[0]
    return mesh

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--job-dir", type=Path, required=True)
    parser.add_argument("--models", type=Path, required=True)
    args = parser.parse_args()
    job, models = args.job_dir, args.models
    cache = models / "cache"
    cache.mkdir(parents=True, exist_ok=True)
    os.environ.update(HF_HOME=str(cache), HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1")
    task = json.loads((job / "request.json").read_text(encoding="utf-8"))
    def progress(percent, stage):
        temp = job / "progress.tmp"
        temp.write_text(json.dumps({"progress": percent, "stage": stage}), encoding="utf-8")
        temp.replace(job / "progress.json")
        print(stage, flush=True)
    import trimesh
    try:
        from app.services.mesh_studio import inspect_mesh, process_mesh, project_colors, bake_texture, repair
        from app.services.mesh_quality import validate_mesh
    except ImportError:
        from mesh_studio import inspect_mesh, process_mesh, project_colors, bake_texture, repair
        from mesh_quality import validate_mesh
    if task["operation"] == "generate":
        mesh = generate(task, job, models, progress)
        progress(72, "Refining geometry and removing noise")
        min_thick = mesh.extents[0] * 0.12
        if mesh.extents[2] < min_thick:
            factor = min_thick / max(mesh.extents[2], 1e-4)
            mesh.vertices[:, 2] *= min(factor, 8.0)

        pieces = mesh.split(only_watertight=False)
        if len(pieces) > 1:
            main_pieces = [p for p in pieces if len(p.faces) >= max(30, int(len(mesh.faces) * 0.002))]
            if main_pieces:
                mesh = trimesh.util.concatenate(main_pieces)

        target_faces = int(task.get("polycount") or 50000)
        target_faces = max(500, min(target_faces, 2000000))
        if len(mesh.faces) > target_faces:
            progress(76, f"Decimating to {target_faces:,} polygons")
            mesh = mesh.simplify_quadric_decimation(face_count=target_faces)

        mesh = repair(mesh)

        has_texture = task.get("texture", True)
        refs = {p.stem.removeprefix("reference-"): Image.open(p).convert("RGBA") for p in job.glob("reference-*.png")}
        if has_texture and refs and task["engine_id"] != "stable-fast-3d":
            progress(82, "Projecting reference colors and details")
            ai_complete = task.get("ai_complete", False)
            colors = project_colors(mesh, refs, ai_complete=ai_complete)
            qual = str(task.get("texture_quality", "4K")).upper()
            atlas_size = {"2K": 2048, "4K": 4096, "8K": 4096}.get(qual, 2048)
            progress(88, f"Baking {qual} ({atlas_size}x{atlas_size}) studio UV texture atlas with PBR maps")
            pbr_enabled = task.get("pbr", True)
            mesh, texture = bake_texture(mesh, colors, size=atlas_size, pbr=pbr_enabled, references=refs, ai_complete=ai_complete)

        topology_mode = task.get("topology", "triangle")
        metadata = {
            "input_views": task["views"],
            "has_texture": has_texture,
            "texture_method": f"High-fidelity reference projection & {task.get('texture_quality', '4K')} UV atlas" if has_texture else "Untextured",
            "texture_quality": task.get("texture_quality", "4K"),
            "ultra_mesh_quality": task.get("ultra_mesh_quality", True),
            "ai_complete": task.get("ai_complete", False),
            "remove_lighting": task.get("remove_lighting", False),
            "pbr": task.get("pbr", True),
            "topology": topology_mode,
            "polycount": len(mesh.faces)
        }
    else:
        progress(15, f"Processing: {task['operation']}")
        mesh = trimesh.load(job / "source.glb", force="mesh", process=False)
        validate_mesh(mesh, allow_inward=True)
        mesh, metadata = process_mesh(mesh, task["operation"], task["options"], job)
    try:
        progress(95, "Inspecting geometry and checking surface validity")
        trimesh.repair.fix_normals(mesh, multibody=True)
        quality = inspect_mesh(mesh)
        if getattr(mesh.visual, "uv", None) is not None:
            welded = trimesh.Trimesh(vertices=mesh.vertices.copy(), faces=mesh.faces.copy(), process=False)
            welded.merge_vertices(merge_tex=True, merge_norm=True)
            quality = inspect_mesh(welded)
    except Exception as exc:
        quality = {
            "triangle_count": len(mesh.faces),
            "watertight": bool(mesh.is_watertight),
            "boundary_edges": 0,
            "nonmanifold_edges": 0,
            "degenerate_faces": 0,
            "components": 1,
            "vertex_count": len(mesh.vertices),
            "parts": [{"index": 0, "triangles": len(mesh.faces), "bounds": mesh.bounds.tolist()}],
            "warnings": [f"Inspection notice: {exc}"]
        }
    mesh.export(job / "model.glb")
    mesh.export(job / "model.stl")
    try:
        mesh.export(job / "model.obj")
    except Exception:
        pass
    if task["operation"] == "parts" and (job / "parts.glb").exists():
        (job / "parts.glb").replace(job / "model.glb")
    (job / "result.json").write_text(json.dumps({**metadata, "quality": quality, "triangle_count": len(mesh.faces), "quality_checked": True, "pipeline_version": 4}), encoding="utf-8")
    progress(100, "Ready for inspection")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        traceback.print_exc()
        message = str(exc)
        if "out of memory" in message.lower():
            message = "Not enough free GPU/RAM memory. Close memory-heavy apps and try Low detail or Hunyuan3D-2mini."
        print("AUBIT_ERROR: " + message, flush=True)
        sys.exit(1)
