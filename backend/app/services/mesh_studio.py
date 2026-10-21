"""Real mesh inspection, conservative repair, UV unwrapping and texture baking."""
import numpy as np
import trimesh
from PIL import Image

try:
    from app.services.mesh_quality import validate_mesh
except ImportError:
    from mesh_quality import validate_mesh

def components(mesh):
    return sorted(mesh.split(only_watertight=False), key=lambda m: (-len(m.faces), *m.centroid))

def inspect_mesh(mesh):
    report = validate_mesh(mesh)
    counts = np.bincount(mesh.edges_unique_inverse)
    pieces = components(mesh)
    report.update(watertight=bool(mesh.is_watertight), boundary_edges=int((counts == 1).sum()),
                  nonmanifold_edges=int((counts > 2).sum()), degenerate_faces=int((mesh.area_faces < 1e-12).sum()),
                  components=len(pieces), vertex_count=len(mesh.vertices),
                  parts=[{"index": i, "triangles": len(p.faces), "bounds": p.bounds.tolist()} for i, p in enumerate(pieces[:100])])
    warnings = []
    if not mesh.is_watertight:
        warnings.append("Open surface: inspect holes before printing.")
    if report["nonmanifold_edges"]:
        warnings.append("Non-manifold edges need manual repair.")
    if len(pieces) > 1:
        warnings.append(f"{len(pieces)} disconnected parts: inspect loose fragments.")
    # A thin object may be intentional. Flag it for inspection rather than guessing.
    if min(mesh.extents) / max(mesh.extents) < 0.015:
        warnings.append("Very thin reconstruction: verify the side views.")
    report["warnings"] = warnings
    return report

def repair(mesh):
    mesh = mesh.copy()
    mesh.update_faces(mesh.unique_faces())
    mesh.update_faces(mesh.nondegenerate_faces())
    mesh.remove_unreferenced_vertices()
    trimesh.repair.fix_normals(mesh, multibody=True)
    trimesh.repair.fill_holes(mesh)
    validate_mesh(mesh)
    return mesh

def unwrap(mesh):
    import xatlas
    mapping, faces, uv = xatlas.parametrize(np.asarray(mesh.vertices, dtype=np.float32), np.asarray(mesh.faces, dtype=np.uint32))
    result = trimesh.Trimesh(vertices=mesh.vertices[mapping], faces=faces, process=False)
    result.visual = trimesh.visual.TextureVisuals(uv=uv)
    return result, mapping

def project_colors(mesh, references, base):
    """Approximate orthographic reference projection. Hidden surfaces keep base color."""
    colors = np.tile(np.array(base, dtype=float), (len(mesh.vertices), 1))
    best = np.full(len(mesh.vertices), -1.0)
    center = mesh.bounds.mean(axis=0)
    scale = max(mesh.extents) / .82
    p = (mesh.vertices - center) / scale
    for view, image in references.items():
        # Hunyuan shape coordinates: Y up, front looks toward -Z.
        direction, horizontal = {"front": ([0,0,1], p[:,0]), "back": ([0,0,-1], -p[:,0]),
                                 "left": ([-1,0,0], p[:,2]), "right": ([1,0,0], -p[:,2])}[view]
        rgba = np.asarray(image.convert("RGBA"))
        h, w = rgba.shape[:2]
        x = np.clip(((horizontal + .5) * (w-1)).astype(int), 0, w-1)
        y = np.clip(((.5 - p[:,1]) * (h-1)).astype(int), 0, h-1)
        score = mesh.vertex_normals @ np.asarray(direction)
        # Z-buffer the mesh vertices to avoid painting the far side through an occluder.
        depth = mesh.vertices @ np.asarray(direction)
        pixel = y*w+x
        z = np.full(w*h, -np.inf)
        np.maximum.at(z, pixel, depth)
        valid = (score > np.maximum(best, .15)) & (rgba[y,x,3] > 64) & (depth >= z[pixel] - scale*.015)
        colors[valid] = rgba[y[valid],x[valid],:3] / 255.
        best[valid] = score[valid]
    return colors

def bake_texture(mesh, colors, size):
    """Rasterize interpolated colors into a non-overlapping xatlas UV atlas using fast OpenCV rasterization."""
    import cv2
    unwrapped, mapping = unwrap(mesh)
    mapped_colors = colors[mapping]
    atlas = np.full((size, size, 3), 230, dtype=np.uint8)
    coverage = np.zeros((size, size), dtype=np.uint8)
    uv = unwrapped.visual.uv * (size - 1)
    uv[:, 1] = size - 1 - uv[:, 1]

    tri_pts = np.round(uv[unwrapped.faces]).astype(np.int32)
    face_colors = np.round(mapped_colors[unwrapped.faces].mean(axis=1) * 255).astype(np.uint8)

    for i in range(len(unwrapped.faces)):
        pts = tri_pts[i]
        col = [int(c) for c in face_colors[i]]
        cv2.fillConvexPoly(atlas, pts, col)
        cv2.fillConvexPoly(coverage, pts, 1)

    has_cov = coverage > 0
    if not has_cov.any():
        atlas[:, :] = [180, 180, 180]
    else:
        # Pad chart borders to prevent dark seams during mipmapping.
        from scipy.ndimage import distance_transform_edt
        distance, nearest = distance_transform_edt(~has_cov, return_indices=True)
        pad = (~has_cov) & (distance <= 4)
        atlas[pad] = atlas[nearest[0][pad], nearest[1][pad]]

    texture = Image.fromarray(atlas)
    unwrapped.visual.material = trimesh.visual.material.PBRMaterial(baseColorTexture=texture, metallicFactor=0, roughnessFactor=1, doubleSided=False)
    unwrapped.visual.vertex_colors = (mapped_colors * 255).astype(np.uint8)
    return unwrapped, texture

def process_mesh(mesh, operation, options, job):
    metadata = {}
    if operation in {"repair", "parts"}:
        if options.get("keep_largest") or options.get("part") is not None:
            pieces = components(mesh)
            index = 0 if options.get("keep_largest") else options["part"]
            if index >= len(pieces):
                raise ValueError("That connected part no longer exists.")
            mesh = pieces[index]
        mesh = repair(mesh)
        if operation == "parts":
            scene = trimesh.Scene()
            for i, part in enumerate(components(mesh)):
                scene.add_geometry(part, node_name=f"part-{i}", geom_name=f"part-{i}")
            scene.export(job / "parts.glb")
            metadata["separated_parts"] = len(scene.geometry)
    elif operation == "optimize":
        target = min(options["target_faces"], len(mesh.faces))
        if target < len(mesh.faces):
            mesh = mesh.simplify_quadric_decimation(face_count=target)
        mesh = repair(mesh)
        mesh, _ = unwrap(mesh)
        metadata.update(has_uv=True, topology="Optimized triangles", target_faces=target)
    elif operation == "texture":
        if len(mesh.faces) > 40000:
            target = min(options.get("target_faces") or 25000, 35000)
            mesh = mesh.simplify_quadric_decimation(face_count=target)
            mesh = repair(mesh)
        base = [int(options["color"][i:i+2],16)/255. for i in (1,3,5)]
        refs = {p.stem.removeprefix("reference-"): Image.open(p).convert("RGBA") for p in job.glob("reference-*.png")} if options["use_references"] else {}
        colors = project_colors(mesh, refs, base)
        light = np.array([-.4,.8,.6]); light /= np.linalg.norm(light)
        illumination = np.clip(mesh.vertex_normals @ light,0,1)
        levels = options["bands"]-1
        shade = .48+.52*np.round(illumination*levels)/levels
        colors *= shade[:,None]
        mesh, texture = bake_texture(mesh, colors, options["texture_size"])
        texture.save(job / "texture.png")
        metadata.update(has_uv=True, has_texture=True, texture_method="Reference projection + baked cel shading" if refs else "Palette + baked cel shading", texture_size=options["texture_size"])
    return mesh, metadata
