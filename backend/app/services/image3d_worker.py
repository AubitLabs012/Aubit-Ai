"""Isolated engine worker. No fallback or synthetic multi-view inputs."""
import argparse
import json
import os
from pathlib import Path
import sys
import traceback

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
        refs[view] = prepare_reference(Image.open(job / f"input-{view}.png"), remove_background=task["remove_background"], align=task["align"], session=session)
        refs[view].save(job / f"reference-{view}.png")
    del session
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
        # Sequential offload works even when a full transformer cannot fit into 6 GB.
        from accelerate import cpu_offload
        for component in (pipeline.conditioner, pipeline.model, pipeline.vae):
            component.eval()
            cpu_offload(component, execution_device=torch.device("cuda"), offload_buffers=True)
        pipeline.device = torch.device("cuda")
        resolution = {"low":192,"standard":256,"high":384}[task["detail"]]
        steps = {"low":20,"standard":30,"high":50}[task["detail"]]
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
        from app.services.mesh_studio import inspect_mesh, process_mesh
        from app.services.mesh_quality import validate_mesh
    except ImportError:
        from mesh_studio import inspect_mesh, process_mesh
        from mesh_quality import validate_mesh
    if task["operation"] == "generate":
        mesh = generate(task, job, models, progress)
        metadata = {"input_views": task["views"], "has_texture": task["engine_id"] == "stable-fast-3d"}
    else:
        progress(15, f"Processing: {task['operation']}")
        mesh = trimesh.load(job / "source.glb", force="mesh", process=False)
        validate_mesh(mesh, allow_inward=True)
        mesh, metadata = process_mesh(mesh, task["operation"], task["options"], job)
    progress(85, "Inspecting geometry and rejecting invalid surfaces")
    trimesh.repair.fix_normals(mesh, multibody=True)
    quality = inspect_mesh(mesh)
    # UV seams duplicate vertices; inspect welds on a copy without changing the atlas.
    if getattr(mesh.visual, "uv", None) is not None:
        welded = mesh.copy(); welded.merge_vertices(merge_tex=True, merge_norm=True)
        quality = inspect_mesh(welded)
    mesh.export(job / "model.glb")
    mesh.export(job / "model.stl")
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
