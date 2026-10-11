from app.config import get_settings


class MongoClientManager:
    _database = None
    _indexes_initialized = False

    def __init__(self) -> None:
        self.settings = get_settings()

    def is_configured(self) -> bool:
        return bool(self.settings.mongo_uri)

    def get_database(self):
        if self.__class__._database is not None:
            return self.__class__._database

        if not self.is_configured():
            return None

        try:
            from pymongo import MongoClient
        except ImportError:
            return None

        client = MongoClient(self.settings.mongo_uri)
        self.__class__._database = client[self.settings.mongo_database]
        return self.__class__._database

    def ensure_indexes(self) -> None:
        if self.__class__._indexes_initialized:
            return

        database = self.get_database()
        if database is None:
            return

        database["users"].create_index("id", unique=True)
        database["users"].create_index("username_lc", unique=True)
        database["ai_responses"].create_index("request_id", unique=True)
        database["ai_responses"].create_index("user_id")
        database["game_events"].create_index("user_id")
        database["game_events"].create_index([("user_id", 1), ("processed_at", -1)])

        self.__class__._indexes_initialized = True
