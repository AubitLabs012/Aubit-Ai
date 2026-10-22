from __future__ import annotations

import json
from collections import defaultdict
from copy import deepcopy
from pathlib import Path
from typing import Optional

from app.db.mongo import MongoClientManager


class InMemoryCollection:
    _stores: dict[str, dict[str, dict]] = {}
    _loaded: bool = False
    _storage_path: Path | None = None

    @classmethod
    def _get_path(cls) -> Path:
        if cls._storage_path is None:
            data_dir = Path(__file__).resolve().parents[2] / "data"
            data_dir.mkdir(parents=True, exist_ok=True)
            cls._storage_path = data_dir / "local_db.json"
        return cls._storage_path

    @classmethod
    def _load_all(cls) -> None:
        if cls._loaded:
            return
        cls._loaded = True
        try:
            path = cls._get_path()
            if path.is_file():
                content = path.read_text(encoding="utf-8")
                if content.strip():
                    data = json.loads(content)
                    if isinstance(data, dict):
                        cls._stores = data
        except Exception:
            pass

    @classmethod
    def _save_all(cls) -> None:
        try:
            path = cls._get_path()
            temp = path.with_suffix(".tmp")
            temp.write_text(json.dumps(cls._stores, indent=2), encoding="utf-8")
            temp.replace(path)
        except Exception:
            pass

    def __init__(self, namespace: str) -> None:
        self.__class__._load_all()
        self.namespace = namespace
        self._stores.setdefault(namespace, {})

    def get(self, key: str) -> Optional[dict]:
        value = self._stores[self.namespace].get(key)
        return deepcopy(value) if value is not None else None

    def upsert(self, key: str, value: dict) -> dict:
        self._stores[self.namespace][key] = deepcopy(value)
        self.__class__._save_all()
        return deepcopy(value)

    def append_event(self, key: str, event: dict) -> list[dict]:
        existing = self._stores[self.namespace].setdefault(key, {"events": []})
        existing.setdefault("events", []).append(deepcopy(event))
        self.__class__._save_all()
        return deepcopy(existing["events"])


class UserRepository:
    def __init__(self) -> None:
        self.collection = InMemoryCollection("users")
        self.mongo_manager = MongoClientManager()
        self.mongo_database = self.mongo_manager.get_database()
        self.mongo_manager.ensure_indexes()
        self.mongo_collection = self.mongo_database["users"] if self.mongo_database is not None else None

    def create(self, user: dict) -> dict:
        profile = {
            "id": user["id"],
            "username": user["username"],
            "username_lc": user["username"].lower(),
            "role": user["role"],
            "display_name": user.get("display_name", ""),
            "password_hash": user.get("password_hash", ""),
            "coins": 0,
            "stars": 0,
            "games_played": 0,
        }
        if self.mongo_collection is not None:
            self.mongo_collection.update_one({"id": user["id"]}, {"$set": deepcopy(profile)}, upsert=True)
            return self.get_by_id(user["id"]) or deepcopy(profile)
        return self.collection.upsert(user["id"], profile)

    def get_or_create(self, user: dict) -> dict:
        existing = self.collection.get(user["id"])
        if self.mongo_collection is not None:
            existing = self.get_by_id(user["id"])
        if existing is not None:
            return existing
        return self.create(user)

    def get_by_id(self, user_id: str) -> Optional[dict]:
        if self.mongo_collection is not None:
            user = self.mongo_collection.find_one({"id": user_id}, {"_id": 0})
            return deepcopy(user) if user is not None else None
        return self.collection.get(user_id)

    def get_by_username(self, username: str) -> Optional[dict]:
        normalized_username = username.lower()
        if self.mongo_collection is not None:
            user = self.mongo_collection.find_one({"username_lc": normalized_username}, {"_id": 0})
            return deepcopy(user) if user is not None else None
        for user in InMemoryCollection._stores.get("users", {}).values():
            if user.get("username", "").lower() == normalized_username:
                return deepcopy(user)
        return None

    def update_rewards(self, user_id: str, coins: int, stars: int) -> dict:
        user = self.collection.get(user_id) or {
            "id": user_id,
            "username": "",
            "role": "user",
            "display_name": "",
            "password_hash": "",
            "coins": 0,
            "stars": 0,
            "games_played": 0,
        }
        user["coins"] += coins
        user["stars"] += stars
        user["games_played"] += 1
        if self.mongo_collection is not None:
            self.mongo_collection.update_one({"id": user_id}, {"$set": deepcopy(user)}, upsert=True)
            return self.get_by_id(user_id) or deepcopy(user)
        return self.collection.upsert(user_id, user)


class GameRepository:
    _events: dict[str, list[dict]] = defaultdict(list)

    def __init__(self) -> None:
        self.mongo_manager = MongoClientManager()
        self.mongo_database = self.mongo_manager.get_database()
        self.mongo_manager.ensure_indexes()
        self.mongo_collection = self.mongo_database["game_events"] if self.mongo_database is not None else None

    def create_event(self, user_id: str, event: dict) -> dict:
        if self.mongo_collection is not None:
            document = {"user_id": user_id, **deepcopy(event)}
            self.mongo_collection.insert_one(document)
            document.pop("_id", None)
            return document
        self._events[user_id].append(deepcopy(event))
        return deepcopy(event)

    def list_events(self, user_id: str) -> list[dict]:
        if self.mongo_collection is not None:
            events = list(self.mongo_collection.find({"user_id": user_id}, {"_id": 0}))
            return deepcopy(events)
        return deepcopy(self._events[user_id])


class AIResponseRepository:
    def __init__(self) -> None:
        self.collection = InMemoryCollection("ai_responses")
        self.mongo_manager = MongoClientManager()
        self.mongo_database = self.mongo_manager.get_database()
        self.mongo_manager.ensure_indexes()
        self.mongo_collection = self.mongo_database["ai_responses"] if self.mongo_database is not None else None

    def save(self, request_id: str, payload: dict) -> dict:
        if self.mongo_collection is not None:
            document = {"request_id": request_id, **deepcopy(payload)}
            self.mongo_collection.update_one({"request_id": request_id}, {"$set": document}, upsert=True)
            saved = self.mongo_collection.find_one({"request_id": request_id}, {"_id": 0})
            return deepcopy(saved) if saved is not None else document
        return self.collection.upsert(request_id, payload)
