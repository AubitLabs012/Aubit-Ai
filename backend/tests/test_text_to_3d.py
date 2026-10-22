import io
import os
import tempfile
import unittest
from unittest.mock import patch

import trimesh
from fastapi.testclient import TestClient

from app.main import app
from app.services.local_3d import generate_model, parse_prompt
from app.services.text_to_3d_service import TextTo3DService


class LocalTextTo3DTests(unittest.TestCase):
    def test_supported_prompt_exports_valid_geometry(self):
        design, glb, stl, faces = generate_model("a small red robot with blue eyes")
        loaded = trimesh.load(io.BytesIO(glb), file_type="glb")
        self.assertEqual(design.kind, "robot")
        self.assertGreater(faces, 100)
        self.assertGreater(len(loaded.geometry), 5)
        self.assertTrue(glb.startswith(b"glTF"))
        self.assertGreater(len(stl), 84)

    def test_descriptions_select_different_models(self):
        robot = generate_model("red robot")[1]
        car = generate_model("blue car")[1]
        self.assertNotEqual(robot, car)
        self.assertEqual(parse_prompt("wooden chair with arms").kind, "chair")
        self.assertEqual(parse_prompt("purple sphere").kind, "shape")
        self.assertEqual(parse_prompt("imaginary alien artifact").kind, "abstract")

    def test_api_builds_and_serves_local_files(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {"AUBIT_3D_OUTPUT_DIR": directory}):
            with TestClient(app) as client:
                login = client.post("/api/login", json={"username": "guest_demo", "password": "Password123", "role": "user"})
                if login.status_code == 401:
                    login = client.post("/api/signup", json={"username": "guest_demo", "password": "Password123", "display_name": "Guest User", "role": "user"})
                self.assertEqual(login.status_code, 200)
                headers = {"Authorization": f"Bearer {login.json()['data']['access_token']}"}
                config = client.get("/api/text-to-3d/config", headers=headers)
                self.assertTrue(config.json()["data"]["available"])
                response = client.post("/api/text-to-3d", headers=headers, json={"prompt": "a green tree"})
                self.assertEqual(response.status_code, 200, response.text)
                data = response.json()["data"]
                self.assertEqual(data["status"], "SUCCEEDED")
                self.assertEqual(data["interpreted_as"], "tree")
                self.assertTrue(TextTo3DService().get_file(data["id"], "glb").is_file())
                glb = client.get(data["model_urls"]["glb"])
                stl = client.get(data["model_urls"]["stl"])
                self.assertEqual(glb.status_code, 200)
                self.assertTrue(glb.content.startswith(b"glTF"))
                self.assertEqual(stl.status_code, 200)
                self.assertGreater(len(stl.content), 84)
                library = client.get("/api/text-to-3d", headers=headers)
                self.assertEqual(library.status_code, 200)
                self.assertEqual(library.json()["data"]["models"][0]["id"], data["id"])
                self.assertEqual(library.json()["data"]["models"][0]["model_urls"], data["model_urls"])
                self.assertEqual(client.get("/api/text-to-3d").status_code, 401)

                # Test delete model endpoint
                del_resp = client.delete(f"/api/text-to-3d/{data['id']}", headers=headers)
                self.assertEqual(del_resp.status_code, 200)
                self.assertTrue(del_resp.json()["data"]["deleted"])
                # Verify library is now empty
                library_after = client.get("/api/text-to-3d", headers=headers)
                self.assertEqual(len(library_after.json()["data"]["models"]), 0)


if __name__ == "__main__":
    unittest.main()
