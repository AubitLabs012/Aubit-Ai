"""Tests for delighting and Geometry & Texture settings.
Run with .venv-image3d: python -m unittest tests_image3d/test_delighting_settings.py
"""
import unittest
import numpy as np
from PIL import Image
import trimesh

from app.services.image3d_worker import delight_image
from app.services.mesh_studio import bake_texture, project_colors


class GeometryTextureSettingsTests(unittest.TestCase):
    def test_delight_image_preserves_dimensions_and_alpha(self):
        # Create an RGBA image with a bright spot / harsh shadow
        arr = np.zeros((64, 64, 4), dtype=np.uint8)
        arr[:, :, 0] = 200 # Red
        arr[:, :, 1] = 50  # Green
        arr[:, :, 2] = 50  # Blue
        arr[:, :, 3] = 255 # Alpha

        # Add a harsh shadow on left half
        arr[:, :32, :3] = (arr[:, :32, :3] * 0.3).astype(np.uint8)

        img = Image.fromarray(arr, "RGBA")
        delighted = delight_image(img)

        self.assertEqual(delighted.size, (64, 64))
        self.assertEqual(delighted.mode, "RGBA")

        # Verify alpha channel is strictly preserved
        delighted_arr = np.array(delighted)
        np.testing.assert_array_equal(delighted_arr[:, :, 3], arr[:, :, 3])

        # Verify shadow on left half was brightened (delighted)
        orig_shadow_mean = np.mean(arr[:, :32, :3])
        delighted_shadow_mean = np.mean(delighted_arr[:, :32, :3])
        self.assertGreaterEqual(delighted_shadow_mean, orig_shadow_mean)

    def test_bake_texture_supports_custom_resolutions(self):
        # Create a simple box mesh
        cube = trimesh.creation.box()
        # Vertex colors array matching vertex count, normalized [0, 1]
        n_verts = len(cube.vertices)
        colors = np.ones((n_verts, 3), dtype=np.float32) * [0.9, 0.4, 0.2]

        # Test 1024 resolution baking
        baked_mesh, texture_img = bake_texture(cube, colors, size=1024, pbr=True)
        mat_1k = baked_mesh.visual.material
        self.assertEqual(mat_1k.baseColorTexture.size, (1024, 1024))
        self.assertEqual(texture_img.size, (1024, 1024))
        self.assertAlmostEqual(mat_1k.roughnessFactor, 0.72)
        self.assertAlmostEqual(mat_1k.metallicFactor, 0.08)

    def test_polycount_decimation_within_bounds(self):
        # Create an icosphere with many triangles
        sphere = trimesh.creation.icosphere(subdivisions=4) # 5,120 faces
        target_faces = 1000

        # Run simplification using face_count
        decimated = sphere.simplify_quadric_decimation(face_count=target_faces)
        self.assertLessEqual(len(decimated.faces), 1500)
        self.assertGreater(len(decimated.faces), 500)
        self.assertTrue(decimated.is_watertight)


if __name__ == "__main__":
    unittest.main()
