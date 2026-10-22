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

def _rasterize_multiview_py(atlas_size, faces, face_normals, uv_pts, verts_3d,
                            v_dirs_arr, v_pts_arr, v_imgs_arr, v_alphas_arr,
                            v_types_arr, center_x, center_z, half_ext_x, half_ext_z,
                            atlas_accum, weight_accum):
    """Multi-view barycentric rasterization with rigorous hemisphere gating and spatial view classification."""
    n_views = len(v_dirs_arr)
    n_faces = len(faces)
    for fi in range(n_faces):
        fn = face_normals[fi]
        f = faces[fi]
        cx = (verts_3d[f[0], 0] + verts_3d[f[1], 0] + verts_3d[f[2], 0]) / 3.0
        cz = (verts_3d[f[0], 2] + verts_3d[f[1], 2] + verts_3d[f[2], 2]) / 3.0
        rel_x = (cx - center_x) / half_ext_x
        rel_z = (cz - center_z) / half_ext_z

        weights = np.zeros(n_views, dtype=np.float32)
        total_w = 0.0
        best_vi = -1
        max_score = -1e9
        for vi in range(n_views):
            vt = v_types_arr[vi]
            # Strict spatial & directional occlusion gating:
            # 0: FRONT (+Z) - looking from +Z to origin; only sees surfaces facing +Z
            # 1: BACK  (-Z) - looking from -Z to origin; only sees surfaces facing -Z
            # 2: LEFT  (-X) - looking from -X to origin; only sees surfaces facing -X
            # 3: RIGHT (+X) - looking from +X to origin; only sees surfaces facing +X
            if vt == 0 and (fn[2] < -0.05 or rel_z < -0.35): continue
            if vt == 1 and (fn[2] >  0.05 or rel_z >  0.35): continue
            if vt == 2 and (fn[0] >  0.05 or rel_x >  0.35): continue
            if vt == 3 and (fn[0] < -0.05 or rel_x < -0.35): continue

            dot = fn[0]*v_dirs_arr[vi, 0] + fn[1]*v_dirs_arr[vi, 1] + fn[2]*v_dirs_arr[vi, 2]
            if dot > max_score:
                max_score = dot
                best_vi = vi
            if dot > 0.05:
                w = dot ** 5
                # Front camera is master aesthetic reference: prioritize for all forward-facing features
                if vt == 0 and fn[2] > 0.15:
                    w *= 3.0
                weights[vi] = w
                total_w += w
        if total_w < 1e-5:
            if best_vi >= 0:
                weights[best_vi] = 1.0
                total_w = 1.0
            else:
                continue
        weights /= total_w
        idx0, idx1, idx2 = f[0], f[1], f[2]
        u0, v0 = uv_pts[idx0, 0], uv_pts[idx0, 1]
        u1, v1 = uv_pts[idx1, 0], uv_pts[idx1, 1]
        u2, v2 = uv_pts[idx2, 0], uv_pts[idx2, 1]
        denom = (v1 - v2) * (u0 - u2) + (u2 - u1) * (v0 - v2)
        if abs(denom) < 1e-6:
            continue
        if denom < 0.0:
            idx0, idx1 = idx1, idx0
            u0, u1 = u1, u0
            v0, v1 = v1, v0
            denom = -denom
        inv_denom = 1.0 / denom
        min_u = max(0, int(np.floor(min(u0, u1, u2))))
        max_u = min(atlas_size - 1, int(np.ceil(max(u0, u1, u2))))
        min_v = max(0, int(np.floor(min(v0, v1, v2))))
        max_v = min(atlas_size - 1, int(np.ceil(max(v0, v1, v2))))
        if min_u > max_u or min_v > max_v:
            continue
        for py in range(min_v, max_v + 1):
            for px in range(min_u, max_u + 1):
                w0 = ((v1 - v2) * (px - u2) + (u2 - u1) * (py - v2)) * inv_denom
                w1 = ((v2 - v0) * (px - u2) + (u0 - u2) * (py - v2)) * inv_denom
                w2 = 1.0 - w0 - w1
                if w0 >= -0.02 and w1 >= -0.02 and w2 >= -0.02:
                    r_c, g_c, b_c, w_c = 0.0, 0.0, 0.0, 0.0
                    for vi in range(n_views):
                        vw = weights[vi]
                        if vw < 1e-4: continue
                        rx = int(np.round(w0 * v_pts_arr[vi, idx0, 0] + w1 * v_pts_arr[vi, idx1, 0] + w2 * v_pts_arr[vi, idx2, 0]))
                        ry = int(np.round(w0 * v_pts_arr[vi, idx0, 1] + w1 * v_pts_arr[vi, idx1, 1] + w2 * v_pts_arr[vi, idx2, 1]))
                        h_ref, w_ref = v_imgs_arr[vi].shape[:2]
                        rx = max(0, min(w_ref - 1, rx))
                        ry = max(0, min(h_ref - 1, ry))
                        if v_alphas_arr[vi, ry, rx] < 20: continue
                        r_c += vw * v_imgs_arr[vi, ry, rx, 0]
                        g_c += vw * v_imgs_arr[vi, ry, rx, 1]
                        b_c += vw * v_imgs_arr[vi, ry, rx, 2]
                        w_c += vw
                    if w_c > 1e-5:
                        atlas_accum[py, px, 0] += r_c / w_c
                        atlas_accum[py, px, 1] += g_c / w_c
                        atlas_accum[py, px, 2] += b_c / w_c
                        weight_accum[py, px] += 1.0

try:
    import numba as nb
    _rasterize_multiview = nb.njit(parallel=True, fastmath=True)(_rasterize_multiview_py)
except ImportError:
    _rasterize_multiview = _rasterize_multiview_py

def project_and_bake_photographic_texture(mesh, references, size=2048, pbr=True, ai_complete=False):
    """Direct camera-to-UV barycentric photographic projection with PBR Normal and Roughness map synthesis."""
    import cv2
    from PIL import Image
    from scipy.ndimage import distance_transform_edt

    unwrapped, mapping = unwrap(mesh)
    trimesh.repair.fix_normals(unwrapped)

    view_order = ["front", "left", "back", "right"]
    view_type_map = {"front": 0, "back": 1, "left": 2, "right": 3}
    view_dirs = {
        "front": np.array([0.0, 0.0, 1.0], dtype=np.float32),
        "left":  np.array([-1.0, 0.0, 0.0], dtype=np.float32),
        "back":  np.array([0.0, 0.0, -1.0], dtype=np.float32),
        "right": np.array([1.0, 0.0, 0.0], dtype=np.float32),
    }

    # If only front view exists, synthesize symmetric back view for 360-degree coverage
    active_refs = dict(references)
    if "front" in active_refs and "back" not in active_refs and (ai_complete or len(active_refs) == 1):
        front_img = active_refs["front"]
        active_refs["back"] = front_img.transpose(Image.FLIP_LEFT_RIGHT)

    v_names = [v for v in view_order if v in active_refs]
    if not v_names:
        v_names = list(active_refs.keys())

    ref_solid = {}
    ref_alphas = {}
    ref_bboxes = {}

    for v in v_names:
        arr = np.array(active_refs[v].convert("RGBA"))
        alpha = arr[:, :, 3] > 20
        if alpha.any():
            rows = np.any(alpha, axis=1)
            cols = np.any(alpha, axis=0)
            ymin, ymax = np.where(rows)[0][[0, -1]]
            xmin, xmax = np.where(cols)[0][[0, -1]]
            ref_bboxes[v] = (int(xmin), int(ymin), int(xmax), int(ymax))
            dist, nearest = distance_transform_edt(~alpha, return_indices=True)
            rgb = arr[:, :, :3].copy()
            rgb[~alpha] = rgb[nearest[0][~alpha], nearest[1][~alpha]]
            # Dilate valid alpha mask up to 25px so silhouette vertices safely sample edge colors
            pad_mask = alpha | (dist <= 25)
            ref_alphas[v] = (pad_mask.astype(np.uint8) * 255)
            ref_solid[v] = rgb
        else:
            ref_bboxes[v] = (0, 0, arr.shape[1] - 1, arr.shape[0] - 1)
            ref_alphas[v] = arr[:, :, 3]
            ref_solid[v] = arr[:, :, :3]

    bounds = unwrapped.bounds
    bmin, bmax = bounds[0], bounds[1]
    diag = bmax - bmin

    uvs = unwrapped.visual.uv
    uv_px = np.column_stack([uvs[:, 0] * (size - 1), (1.0 - uvs[:, 1]) * (size - 1)]).astype(np.float32)

    view_img_pts = {}
    vx = unwrapped.vertices[:, 0]
    vy = unwrapped.vertices[:, 1]
    vz = unwrapped.vertices[:, 2]

    for v in v_names:
        xmin, ymin, xmax, ymax = ref_bboxes[v]
        if v == "front":
            h_coord = (vx - bmin[0]) / max(diag[0], 1e-4)
        elif v == "back":
            h_coord = (bmax[0] - vx) / max(diag[0], 1e-4)
        elif v == "left":
            h_coord = (bmax[2] - vz) / max(diag[2], 1e-4)
        elif v == "right":
            h_coord = (vz - bmin[2]) / max(diag[2], 1e-4)
        else:
            h_coord = (vx - bmin[0]) / max(diag[0], 1e-4)

        v_coord = (vy - bmin[1]) / max(diag[1], 1e-4)
        px = xmin + h_coord * (xmax - xmin)
        py = ymax - v_coord * (ymax - ymin)
        view_img_pts[v] = np.column_stack([px, py]).astype(np.float32)

    atlas_accum = np.zeros((size, size, 3), dtype=np.float32)
    weight_accum = np.zeros((size, size), dtype=np.float32)

    v_dirs_arr = np.array([view_dirs.get(v, np.array([0.0, 0.0, 1.0], dtype=np.float32)) for v in v_names], dtype=np.float32)
    v_types_arr = np.array([view_type_map.get(v, 0) for v in v_names], dtype=np.int32)
    v_pts_arr = np.stack([view_img_pts[v] for v in v_names], axis=0).astype(np.float32)
    v_imgs_arr = np.stack([ref_solid[v] for v in v_names], axis=0).astype(np.uint8)
    v_alphas_arr = np.stack([ref_alphas[v] for v in v_names], axis=0).astype(np.uint8)

    center_x = float((bmin[0] + bmax[0]) * 0.5)
    center_z = float((bmin[2] + bmax[2]) * 0.5)
    half_ext_x = float(max((bmax[0] - bmin[0]) * 0.5, 1e-4))
    half_ext_z = float(max((bmax[2] - bmin[2]) * 0.5, 1e-4))

    verts_3d = unwrapped.vertices.astype(np.float32)
    faces = unwrapped.faces.astype(np.int32)
    face_normals = unwrapped.face_normals.astype(np.float32)

    _rasterize_multiview(size, faces, face_normals, uv_px, verts_3d,
                         v_dirs_arr, v_pts_arr, v_imgs_arr, v_alphas_arr,
                         v_types_arr, center_x, center_z, half_ext_x, half_ext_z,
                         atlas_accum, weight_accum)

    covered = weight_accum > 0
    final_atlas = np.zeros((size, size, 3), dtype=np.uint8)
    for c in range(3):
        final_atlas[:, :, c][covered] = np.clip(atlas_accum[:, :, c][covered] / weight_accum[covered], 0, 255).astype(np.uint8)

    # Inpaint any remaining crevices using nearest valid surface pixels
    if covered.any():
        dist, nearest = distance_transform_edt(~covered, return_indices=True)
        final_atlas[~covered] = final_atlas[nearest[0][~covered], nearest[1][~covered]]
    else:
        final_atlas[:] = 180

    texture = Image.fromarray(final_atlas)

    if pbr:
        # 1. Synthesize Tangent-Space Normal Map for depth & embossing
        gray = cv2.cvtColor(final_atlas, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
        smooth_gray = cv2.GaussianBlur(gray, (5, 5), 1.0)
        sobel_x = cv2.Sobel(smooth_gray, cv2.CV_32F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(smooth_gray, cv2.CV_32F, 0, 1, ksize=3)
        strength = 1.0
        nx = -sobel_x * strength
        ny = -sobel_y * strength
        nz = np.ones_like(gray)
        norm = np.sqrt(nx*nx + ny*ny + nz*nz)
        nx /= norm; ny /= norm; nz /= norm

        # 2. Synthesize PBR Metallic-Roughness Map (ORM format: Green=Roughness, Blue=Metallic)
        hsv = cv2.cvtColor(final_atlas, cv2.COLOR_RGB2HSV)
        val = hsv[:, :, 2] / 255.0
        sat = hsv[:, :, 1] / 255.0

        roughness = np.full((size, size), 0.55, dtype=np.float32)
        metallic = np.zeros((size, size), dtype=np.float32)

        # Visor/glass: glossy, smooth glass screen with flat normal (prevents speckle noise on LED graphics)
        visor_mask = (val < 0.20) & (sat < 0.25)
        roughness[visor_mask] = 0.12
        metallic[visor_mask] = 0.05
        nx[visor_mask] = 0.0
        ny[visor_mask] = 0.0
        nz[visor_mask] = 1.0

        # Dielectric clean plastics / ceramics (e.g. white robot shell):
        # Non-metallic (metallic = 0.0) with smooth-matte finish so white colors stay vibrant and bright!
        white_shell_mask = (val > 0.65) & (sat < 0.20) & (~visor_mask)
        roughness[white_shell_mask] = 0.32
        metallic[white_shell_mask] = 0.0

        # Chrome/metallic accents: only for dark gunmetal or explicit saturated metallics (gold/bronze)
        gold_mask = (val > 0.40) & (sat > 0.50) & (hsv[:, :, 0] < 35)
        metallic[gold_mask] = 0.85
        roughness[gold_mask] = 0.25

        # Normal map packing
        normal_map = np.zeros((size, size, 3), dtype=np.uint8)
        normal_map[:, :, 0] = np.clip((nx * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
        normal_map[:, :, 1] = np.clip((ny * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
        normal_map[:, :, 2] = np.clip((nz * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
        normal_img = Image.fromarray(normal_map)

        orm = np.zeros((size, size, 3), dtype=np.uint8)
        orm[:, :, 0] = 255  # Ambient Occlusion
        orm[:, :, 1] = np.clip(roughness * 255, 0, 255).astype(np.uint8)
        orm[:, :, 2] = np.clip(metallic * 255, 0, 255).astype(np.uint8)
        orm_img = Image.fromarray(orm)

        unwrapped.visual.material = trimesh.visual.material.PBRMaterial(
            name="StudioPBRMaterial",
            baseColorTexture=texture,
            normalTexture=normal_img,
            metallicRoughnessTexture=orm_img,
            metallicFactor=1.0,
            roughnessFactor=1.0,
            doubleSided=True
        )
    else:
        unwrapped.visual.material = trimesh.visual.material.PBRMaterial(
            baseColorTexture=texture,
            metallicFactor=0.0,
            roughnessFactor=1.0,
            doubleSided=True
        )

    return unwrapped, texture

def bake_texture(mesh, colors=None, size=2048, pbr=True, references=None, ai_complete=False):
    """Bake texture into UV atlas. Uses direct photographic projection if references are given, else vertex color interpolation."""
    if references and len(references) > 0:
        return project_and_bake_photographic_texture(mesh, references, size=size, pbr=pbr, ai_complete=ai_complete)

    import cv2
    from PIL import Image
    from scipy.ndimage import distance_transform_edt
    unwrapped, mapping = unwrap(mesh)
    if colors is not None:
        mapped_colors = colors[mapping]
    else:
        mapped_colors = np.full((len(unwrapped.vertices), 3), 0.7)

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
        distance, nearest = distance_transform_edt(~has_cov, return_indices=True)
        pad = (~has_cov) & (distance <= 6)
        atlas[pad] = atlas[nearest[0][pad], nearest[1][pad]]

    texture = Image.fromarray(atlas)
    metallic = 0.08 if pbr else 0.0
    roughness = 0.72 if pbr else 1.0
    unwrapped.visual.material = trimesh.visual.material.PBRMaterial(baseColorTexture=texture, metallicFactor=metallic, roughnessFactor=roughness, doubleSided=True)
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
