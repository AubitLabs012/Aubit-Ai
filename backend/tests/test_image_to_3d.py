import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.services import image3d_jobs
from app.services.image_3d import InvalidImage, read_image


def create_test_image(color=(255, 0, 0, 255), size=(64, 64), fmt="PNG") -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGBA" if fmt == "PNG" else "RGB", size, color)
    img.save(buf, format=fmt)
    return buf.getvalue()


class ImageTo3DTests(unittest.TestCase):
    def test_read_image_validates_formats(self):
        png_data = create_test_image()
        image = read_image(png_data)
        self.assertEqual(image.size, (64, 64))

        jpeg_data = create_test_image(color=(0, 255, 0), fmt="JPEG")
        image_jpg = read_image(jpeg_data)
        self.assertEqual(image_jpg.size, (64, 64))

    def test_read_image_rejects_invalid_inputs(self):
        with self.assertRaises(InvalidImage):
            read_image(b"")

        with self.assertRaises(InvalidImage):
            read_image(b"not an image file")

        # Completely transparent
        transparent = create_test_image(color=(0, 0, 0, 0))
        with self.assertRaises(InvalidImage):
            read_image(transparent)

    def test_config_reports_local_availability(self):
        cfg = image3d_jobs.config()
        self.assertTrue(cfg["local"])
        self.assertIn("engines", cfg)
        self.assertEqual(len(cfg["engines"]), 4)
        engine_ids = [e["id"] for e in cfg["engines"]]
        self.assertEqual(engine_ids, ["hunyuan-mini", "hunyuan-mv", "hunyuan-2.1", "stable-fast-3d"])
        self.assertEqual(cfg["default_engine"], "hunyuan-mini")
        self.assertEqual(cfg["max_upload_mb"], 10)
        self.assertEqual(cfg["max_views"], 4)
        # Ensure TripoSR is not present
        self.assertNotIn("triposr", engine_ids)
        self.assertNotIn("tripo-sr", engine_ids)

    def test_api_config_and_submission(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {"AUBIT_3D_OUTPUT_DIR": directory}):
            with patch("app.services.image3d_jobs.run_job") as mock_run:
                with patch("app.services.image3d_jobs.engine_status") as mock_status:
                    mock_status.return_value = {
                        "id": "hunyuan-mini",
                        "name": "Hunyuan3D-2mini",
                        "available": True,
                        "message": "Installed locally",
                        "views": ["front"],
                        "description": "Stability baseline",
                        "setup_command": "python setup.py",
                    }
                    with TestClient(app) as client:
                        login = client.post("/api/login", json={"username": "test_img_user", "password": "Password123", "role": "user"})
                        if login.status_code == 401:
                            login = client.post("/api/signup", json={"username": "test_img_user", "password": "Password123", "display_name": "Test Img User", "role": "user"})
                        self.assertEqual(login.status_code, 200)
                        headers = {"Authorization": f"Bearer {login.json()['data']['access_token']}"}

                        cfg_resp = client.get("/api/image-to-3d/config", headers=headers)
                        self.assertEqual(cfg_resp.status_code, 200)
                        data = cfg_resp.json()["data"]
                        self.assertTrue(data["local"])
                        self.assertEqual(len(data["engines"]), 4)

                        # Valid image upload creates a job with status 202
                        png_bytes = create_test_image()
                        files = [("images", ("front.png", io.BytesIO(png_bytes), "image/png"))]
                        form_data = {
                            "views": json.dumps(["front"]),
                            "engine": "hunyuan-mini",
                            "detail": "standard",
                            "remove_background": "true",
                            "align": "true",
                            "seed": "12345",
                        }
                        create_resp = client.post("/api/image-to-3d", headers=headers, files=files, data=form_data)
                        self.assertEqual(create_resp.status_code, 202)
                        task = create_resp.json()["data"]
                        self.assertIn("id", task)
                        self.assertEqual(task["source"], "image")
                        self.assertEqual(task["engine_id"], "hunyuan-mini")
                        self.assertEqual(task["views"], ["front"])
                        mock_run.assert_called_once()
                        self.addCleanup(image3d_jobs._active.discard, task["id"])
                        self.addCleanup(image3d_jobs._lock.release)

                        # Poll job
                        job_resp = client.get(f"/api/image-to-3d/{task['id']}", headers=headers)
                        self.assertEqual(job_resp.status_code, 200)
                        self.assertEqual(job_resp.json()["data"]["id"], task["id"])

    def test_geometry_texture_settings_forwarded(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {"AUBIT_3D_OUTPUT_DIR": directory}):
            with patch("app.services.image3d_jobs.run_job") as mock_run:
                with patch("app.services.image3d_jobs.engine_status") as mock_status:
                    mock_status.return_value = {
                        "id": "hunyuan-mini",
                        "name": "Hunyuan3D-2mini",
                        "available": True,
                        "message": "Installed locally",
                        "views": ["front"],
                        "description": "Stability baseline",
                        "setup_command": "python setup.py",
                    }
                    with TestClient(app) as client:
                        login = client.post("/api/login", json={"username": "test_img_user", "password": "Password123", "role": "user"})
                        headers = {"Authorization": f"Bearer {login.json()['data']['access_token']}"}

                        png_bytes = create_test_image()
                        files = [("images", ("front.png", io.BytesIO(png_bytes), "image/png"))]
                        form_data = {
                            "views": json.dumps(["front"]),
                            "engine": "hunyuan-mini",
                            "detail": "high",
                            "remove_background": "true",
                            "align": "true",
                            "seed": "42",
                            "ultra_mesh_quality": "true",
                            "ai_complete": "true",
                            "texture": "true",
                            "texture_quality": "8K",
                            "remove_lighting": "true",
                            "pbr": "true",
                            "topology": "quad",
                            "polycount": "150000",
                        }
                        create_resp = client.post("/api/image-to-3d", headers=headers, files=files, data=form_data)
                        self.assertEqual(create_resp.status_code, 202)
                        task = create_resp.json()["data"]
                        self.assertEqual(task["ultra_mesh_quality"], True)
                        self.assertEqual(task["ai_complete"], True)
                        self.assertEqual(task["texture"], True)
                        self.assertEqual(task["texture_quality"], "8K")
                        self.assertEqual(task["remove_lighting"], True)
                        self.assertEqual(task["pbr"], True)
                        self.assertEqual(task["topology"], "quad")
                        self.assertEqual(task["polycount"], 150000)

                        job_dir = Path(directory) / "image-jobs" / task["id"]
                        req_json = json.loads((job_dir / "request.json").read_text())
                        self.assertEqual(req_json["ultra_mesh_quality"], True)
                        self.assertEqual(req_json["ai_complete"], True)
                        self.assertEqual(req_json["texture_quality"], "8K")
                        self.assertEqual(req_json["remove_lighting"], True)
                        self.assertEqual(req_json["topology"], "quad")
                        self.assertEqual(req_json["polycount"], 150000)

                        self.addCleanup(image3d_jobs._active.discard, task["id"])
                        self.addCleanup(image3d_jobs._lock.release)


if __name__ == "__main__":
    unittest.main()
