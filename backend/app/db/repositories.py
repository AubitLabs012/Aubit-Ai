from __future__ import annotations

from collections import defaultdict
from copy import deepcopy
from typing import Optional

from app.db.mongo import MongoClientManager


class InMemoryCollection:
    _stores: dict[str, dict[str, dict]] = {}

    def __init__(self, namespace: str) -> None:
        self.namespace = namespace
        self._stores.setdefault(namespace, {})

    def get(self, key: str) -> Optional[dict]:
        value = self._stores[self.namespace].get(key)
        return deepcopy(value) if value is not None else None

    def upsert(self, key: str, value: dict) -> dict:
        self._stores[self.namespace][key] = deepcopy(value)
        return deepcopy(value)

    def append_event(self, key: str, event: dict) -> list[dict]:
        existing = self._stores[self.namespace].setdefault(key, {"events": []})
        existing.setdefault("events", []).append(deepcopy(event))
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
