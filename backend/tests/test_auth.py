import tempfile
from pathlib import Path
import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.db.repositories import InMemoryCollection, UserRepository
from app.auth.service import AuthService


class AuthFlowTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        InMemoryCollection._storage_path = Path(self.temp_dir.name) / "test_db.json"
        InMemoryCollection._loaded = False
        InMemoryCollection._stores = {}

    def tearDown(self):
        self.temp_dir.cleanup()
        InMemoryCollection._storage_path = None
        InMemoryCollection._loaded = False
        InMemoryCollection._stores = {}

    def test_new_user_can_directly_sign_in(self):
        with TestClient(app) as client:
            resp = client.post("/api/login", json={"username": "new_hero", "password": "Password123!", "role": "user"})
            self.assertEqual(resp.status_code, 200)
            data = resp.json()["data"]
            self.assertTrue(data["access_token"])
            self.assertEqual(data["user"]["username"], "new_hero")

            # Signing in again with correct password succeeds
            login2 = client.post("/api/login", json={"username": "new_hero", "password": "Password123!", "role": "user"})
            self.assertEqual(login2.status_code, 200)

            # Signing in with wrong password fails
            bad_login = client.post("/api/login", json={"username": "new_hero", "password": "WrongPassword999", "role": "user"})
            self.assertEqual(bad_login.status_code, 401)
            self.assertIn("Invalid password", bad_login.json()["detail"])

    def test_signup_with_existing_credentials_logs_in(self):
        with TestClient(app) as client:
            # Create user
            resp1 = client.post("/api/signup", json={"username": "pilot_user", "password": "MySecretPass1", "display_name": "Pilot", "role": "user"})
            self.assertEqual(resp1.status_code, 200)

            # Re-signing up with same password returns token bundle
            resp2 = client.post("/api/signup", json={"username": "pilot_user", "password": "MySecretPass1", "display_name": "Pilot", "role": "user"})
            self.assertEqual(resp2.status_code, 200)
            self.assertTrue(resp2.json()["data"]["access_token"])

            # Signing up with different password fails
            resp3 = client.post("/api/signup", json={"username": "pilot_user", "password": "DifferentPass9", "display_name": "Pilot", "role": "user"})
            self.assertEqual(resp3.status_code, 400)


if __name__ == "__main__":
    unittest.main()
