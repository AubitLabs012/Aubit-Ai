"""Geometry checks at inference, postprocessing and export boundaries."""
import numpy as np
import trimesh


def validate_mesh(mesh: trimesh.Trimesh, reference: trimesh.Trimesh | None = None, *, allow_inward: bool = False) -> dict:
    vertices = np.asarray(mesh.vertices)
    faces = np.asarray(mesh.faces)
    if len(vertices) < 4 or len(faces) < 4:
        raise ValueError("The reconstruction contains too little geometry.")
    if not np.isfinite(vertices).all():
        raise ValueError("The reconstruction contains invalid vertex coordinates.")
    if faces.min() < 0 or faces.max() >= len(vertices):
        raise ValueError("The reconstruction contains invalid triangle indices.")
    diagonal = float(np.linalg.norm(mesh.extents))
    if diagonal < 1e-5:
        raise ValueError("The reconstruction collapsed to an empty surface.")
    if not allow_inward and mesh.is_watertight and mesh.volume <= 0:
        raise ValueError("The reconstruction has inward-facing surfaces.")
    edges = mesh.edges_unique_length
    if not np.isfinite(edges).all():
        raise ValueError("The reconstruction contains invalid edges.")
    if reference is not None:
        original_diagonal = float(np.linalg.norm(reference.extents))
        padding = original_diagonal * 0.035
        if (vertices < reference.bounds[0] - padding).any() or (vertices > reference.bounds[1] + padding).any():
            raise ValueError("Mesh processing stretched vertices beyond the reconstructed object.")
        if diagonal < original_diagonal * 0.85:
            raise ValueError("Mesh processing collapsed the reconstructed object.")
        # Existing long, thin triangles must not grow during smoothing/repair.
        if edges.max() > reference.edges_unique_length.max() * 1.5 + original_diagonal * 0.005:
            raise ValueError("Mesh processing introduced stretched triangles.")
    return {"bounds": mesh.bounds.tolist(), "max_edge": float(edges.max()),
            "triangle_count": len(faces), "quality_checked": True}
