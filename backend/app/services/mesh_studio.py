"""Real mesh inspection, conservative repair, UV unwrapping and texture baking."""
import numpy as np
import trimesh
from PIL import Image

try:
    from app.services.mesh_quality import validate_mesh
except ImportError:
    from mesh_quality import validate_mesh

def components(mesh, max_parts=50, min_faces=10):
    """Memory-safe extraction of significant connected components without exploding RAM."""
    if len(mesh.faces) == 0:
        return []
    face_comps = trimesh.graph.connected_components(mesh.face_adjacency, nodes=np.arange(len(mesh.faces)))
    face_comps = sorted(face_comps, key=len, reverse=True)
    significant = [fc for fc in face_comps if len(fc) >= min_faces][:max_parts]
    if not significant and face_comps:
        significant = [face_comps[0]]
    return [mesh.submesh(fc, append=True) for fc in significant]

def inspect_mesh(mesh):
    report = validate_mesh(mesh)
    counts = np.bincount(mesh.edges_unique_inverse)
    # Memory-safe graph connected components: zero Trimesh submesh allocations, zero texture cloning
    if len(mesh.faces) > 0:
        face_comps = trimesh.graph.connected_components(mesh.face_adjacency, nodes=np.arange(len(mesh.faces)))
        face_comps = sorted(face_comps, key=len, reverse=True)
    else:
        face_comps = []

    parts_info = []
    for i, fc in enumerate(face_comps[:50]):
        fc_faces = mesh.faces[fc]
        fc_verts = mesh.vertices[fc_faces.ravel()]
        bounds = [fc_verts.min(axis=0).tolist(), fc_verts.max(axis=0).tolist()]
        parts_info.append({"index": i, "triangles": len(fc), "bounds": bounds})

    report.update(watertight=bool(mesh.is_watertight), boundary_edges=int((counts == 1).sum()),
                  nonmanifold_edges=int((counts > 2).sum()), degenerate_faces=int((mesh.area_faces < 1e-12).sum()),
                  components=len(face_comps), vertex_count=len(mesh.vertices),
                  parts=parts_info)
    warnings = []
    if not mesh.is_watertight:
        warnings.append("Open surface: inspect holes before printing.")
    if report["nonmanifold_edges"]:
        warnings.append("Non-manifold edges need manual repair.")
    if len(face_comps) > 1:
        warnings.append(f"{len(face_comps)} disconnected parts: inspect loose fragments.")
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

def project_colors(mesh, references, base=None, ai_complete=True):
    """Accurate reference color projection. Uses bilateral symmetry & 3D spatial diffusion for unseen surfaces."""
    import numpy as np
    from scipy.spatial import cKDTree
    from scipy.ndimage import distance_transform_edt

    colors = np.zeros((len(mesh.vertices), 3), dtype=float)
    best = np.full(len(mesh.vertices), -1.0)
    has_projected = np.zeros(len(mesh.vertices), dtype=bool)

    center = mesh.bounds.mean(axis=0)
    scale = max(mesh.extents) / .82
    p = (mesh.vertices - center) / scale

    # Sample dominant base color as fallback
    all_pixels = []
    for image in references.values():
        rgba_arr = np.asarray(image.convert("RGBA"))
        mask = rgba_arr[:, :, 3] > 48
        if mask.any():
            all_pixels.append(rgba_arr[mask][:, :3])
    fallback_color = np.vstack(all_pixels).mean(axis=0) / 255.0 if all_pixels else np.array([0.7, 0.7, 0.7])

    for view, image in references.items():
        if view not in {"front", "back", "left", "right"}:
            continue
        direction, horizontal = {"front": ([0,0,1], p[:,0]), "back": ([0,0,-1], -p[:,0]),
                                 "left": ([-1,0,0], p[:,2]), "right": ([1,0,0], -p[:,2])}[view]
        rgba = np.asarray(image.convert("RGBA"))
        h, w = rgba.shape[:2]

        # Extrapolate edge pixels so silhouette boundary vertices do not hit transparency
        alpha_mask = rgba[:, :, 3] > 48
        if alpha_mask.any():
            dist, nearest = distance_transform_edt(~alpha_mask, return_indices=True)
            rgb_solid = rgba[:, :, :3].copy()
            pad_mask = (~alpha_mask) & (dist <= 12)
            rgb_solid[pad_mask] = rgb_solid[nearest[0][pad_mask], nearest[1][pad_mask]]
            valid_pixels = alpha_mask | pad_mask
        else:
            rgb_solid = rgba[:, :, :3]
            valid_pixels = np.ones((h, w), dtype=bool)

        x = np.clip(((horizontal + .5) * (w-1)).astype(int), 0, w-1)
        y = np.clip(((.5 - p[:,1]) * (h-1)).astype(int), 0, h-1)
        score = mesh.vertex_normals @ np.asarray(direction)
        depth = mesh.vertices @ np.asarray(direction)
        pixel = y*w+x
        z = np.full(w*h, -np.inf)
        np.maximum.at(z, pixel, depth)

        valid = (score > np.maximum(best, .02)) & valid_pixels[y, x] & (depth >= z[pixel] - scale*.035)
        colors[valid] = rgb_solid[y[valid], x[valid]] / 255.0
        best[valid] = score[valid]
        has_projected[valid] = True

    # Bilateral symmetry projection for unseen back surfaces if back angle was not provided
    if ai_complete and "front" in references and "back" not in references:
        front_img = np.asarray(references["front"].convert("RGBA"))
        h, w = front_img.shape[:2]
        alpha_front = front_img[:, :, 3] > 48
        dist, nearest = distance_transform_edt(~alpha_front, return_indices=True)
        front_solid = front_img[:, :, :3].copy()
        pad = (~alpha_front) & (dist <= 12)
        front_solid[pad] = front_solid[nearest[0][pad], nearest[1][pad]]
        front_valid = alpha_front | pad

        back_facing = (mesh.vertex_normals @ np.asarray([0, 0, -1]) > 0.02) & (~has_projected)
        x_sym = np.clip(((-p[:, 0] + .5) * (w - 1)).astype(int), 0, w - 1)
        y_sym = np.clip(((.5 - p[:, 1]) * (h - 1)).astype(int), 0, h - 1)
        valid_sym = back_facing & front_valid[y_sym, x_sym]
        colors[valid_sym] = front_solid[y_sym[valid_sym], x_sym[valid_sym]] / 255.0
        has_projected[valid_sym] = True

    # 3D spatial diffusion for any remaining uncolored vertices (crevices, undersides)
    if has_projected.any():
        if ai_complete and not has_projected.all():
            tree = cKDTree(mesh.vertices[has_projected])
            _, nearest_idx = tree.query(mesh.vertices[~has_projected])
            colors[~has_projected] = colors[has_projected][nearest_idx]
        elif not ai_complete and not has_projected.all():
            colors[~has_projected] = fallback_color
    else:
        colors[:] = fallback_color

    return colors

def bake_texture(mesh, colors, size, pbr=True):
    """Rasterize interpolated colors into a non-overlapping xatlas UV atlas using fast OpenCV rasterization."""
    import cv2
    from PIL import Image
    from scipy.ndimage import distance_transform_edt
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
        distance, nearest = distance_transform_edt(~has_cov, return_indices=True)
        pad = (~has_cov) & (distance <= 6)
        atlas[pad] = atlas[nearest[0][pad], nearest[1][pad]]

    texture = Image.fromarray(atlas)
    metallic = 0.08 if pbr else 0.0
    roughness = 0.72 if pbr else 1.0
    unwrapped.visual.material = trimesh.visual.material.PBRMaterial(baseColorTexture=texture, metallicFactor=metallic, roughnessFactor=roughness, doubleSided=False)
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
