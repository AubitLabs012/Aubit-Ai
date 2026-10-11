# Aubit ER Diagram

This ER diagram is based on the current backend persistence code in `backend/app/db/repositories.py`, `backend/app/db/mongo.py`, `backend/app/services/game_service.py`, and `backend/app/services/ai_service.py`.

```mermaid
erDiagram
    USERS ||--o{ GAME_EVENTS : "plays / earns rewards"
    USERS ||--o{ AI_RESPONSES : "requests"

    USERS {
        string id PK
        string username
        string username_lc UK
        string role
        string display_name
        string password_hash
        int coins
        int stars
        int games_played
    }

    GAME_EVENTS {
        string user_id FK
        string game_type
        string result
        int score
        object rewards
        string processed_at
    }

    AI_RESPONSES {
        string request_id PK
        string user_id FK
        string response
        string transcript
        string voice_preview
        boolean cached
        string provider
        string model
        string content_type
        number duration
        string language
        string generated_at
    }
```

## Relationship Notes

- `USERS.id` is the logical primary key for user profiles.
- `USERS.username_lc` is unique and used for case-insensitive login lookup.
- `GAME_EVENTS.user_id` points to `USERS.id`. A user can have many game result events.
- `AI_RESPONSES.user_id` points to `USERS.id`. A user can have many saved AI prompt or transcription responses.
- `AI_RESPONSES.request_id` is unique and identifies each saved AI response or transcription request.

## MongoDB Indexes

```text
users.id unique
users.username_lc unique
ai_responses.request_id unique
ai_responses.user_id
game_events.user_id
game_events.user_id + game_events.processed_at descending
```
