"""Run with .venv-image3d: python -m unittest discover -s tests_image3d -v."""
import unittest

import numpy as np
import trimesh

from app.services.hunyuan3d_pipeline import curvature_adaptive_taubin_filter
from app.services.mesh_quality import validate_mesh


class MeshQualityTests(unittest.TestCase):
    def test_dense_surface_does_not_explode(self):
        # The old area-inverse explicit update expanded this sphere 249x.
        for scale in (0.01, 1, 100):
            with self.subTest(scale=scale):
                mesh = trimesh.creation.icosphere(subdivisions=3, radius=scale)
                mesh.apply_translation([scale * 2, scale, -scale])
                result = curvature_adaptive_taubin_filter(mesh, iterations=6)
                validate_mesh(result, mesh)
                self.assertTrue(result.is_watertight)
                np.testing.assert_allclose(result.extents, mesh.extents, rtol=0.03)
                self.assertLess(np.linalg.norm(result.vertices - mesh.vertices, axis=1).max(), scale * 0.03)

    def test_sharp_corners_are_preserved(self):
        mesh = trimesh.creation.box()
        mesh = mesh.subdivide()
        result = curvature_adaptive_taubin_filter(mesh)
        np.testing.assert_allclose(result.bounds, mesh.bounds, atol=1e-8)
        self.assertTrue(result.is_watertight)

    def test_finite_exploded_geometry_is_rejected(self):
        original = trimesh.creation.icosphere(subdivisions=2)
        bad = original.copy()
        bad.vertices[0] = [1e10, 2e10, -1e10]
        with self.assertRaisesRegex(ValueError, "stretched"):
            validate_mesh(bad, original)

    def test_invalid_and_collapsed_meshes_are_rejected(self):
        for value in (np.nan, np.inf):
            mesh = trimesh.creation.box()
            mesh.vertices[0, 0] = value
            with self.assertRaises(ValueError):
                validate_mesh(mesh)
        mesh = trimesh.creation.box()
        mesh.vertices *= 0
        with self.assertRaises(ValueError):
            validate_mesh(mesh)

    def test_inward_faces_must_be_corrected_before_export(self):
        mesh = trimesh.creation.icosphere(subdivisions=2)
        mesh.invert()
        with self.assertRaisesRegex(ValueError, "inward"):
            validate_mesh(mesh)
        mesh.fix_normals(multibody=True)
        validate_mesh(mesh)
        self.assertGreater(mesh.volume, 0)


if __name__ == "__main__":
    unittest.main()
