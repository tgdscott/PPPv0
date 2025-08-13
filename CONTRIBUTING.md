# Contributing Guide — PPP v0

This repo is a monorepo with:
- **Backend**: FastAPI + Celery (RabbitMQ), SQLite
- **Frontend**: React + Vite + shadcn/ui (Tailwind)
- **Audio**: ffmpeg, OpenAI (transcription), ElevenLabs (TTS)
- **Publishing**: Spreaker v2 API (OAuth2)

---

## Guardrails (“don’t break things”)

- ✅ Must **not** break local dev
- ✅ Must **not** break existing demo data/templates
- ✅ Backward-compatible API changes only (additive responses, keep old paths alive)
- ❌ No prod/staging constraints (local only right now)
- ❌ No zero-downtime requirement

**API compatibility:**  
Frontend relies on these contracts — **do not rename/remove** without leaving aliases:

- `GET /api/spreaker/shows` → `{ shows: Array<Show> }`
- `POST /api/media/upload/{category}` with categories:
  `intro | outro | music | commercial | sfx | main_content | podcast_cover | episode_cover`
- `POST /api/episodes/assemble` → `{ job_id }`
- `GET /api/episodes/status/{job_id}` →  
  `{ status: 'queued'|'processing'|'processed'|'error', episode?: {id}, message?: string, error?: string }`
- `POST /api/episodes/{episode_id}/publish` **(alias must exist)**  
  body: `{ spreaker_show_id: string, publish_state: 'unpublished'|'public', description?: string }`  
  response: `{ message, spreaker_episode_id? }`

---

## Project layout

/frontend/ # React + Vite
/podcast-pro-plus/ # FastAPI, Celery, DB, services
api/
main.py
routers/
episodes.py
spreaker.py
wizard.py
... # (media, templates, users, admin, etc.)
services/
audio_processor.py
publisher.py
ai_enhancer.py
worker/tasks.py
database.db # SQLite (local)
media_uploads/ # uploaded files (local)
final_episodes/ # rendered episodes (local)

bash
Copy
Edit

---

## Prereqs

- **Python 3.12**
- **Node 20+**
- **ffmpeg** on PATH
- **RabbitMQ** running locally (default: `amqp://guest:guest@127.0.0.1:5672//`)

---

## First-time setup

```bash
# 1) Backend deps
cd podcast-pro-plus
python -m venv venv
source venv/Scripts/activate 2>/dev/null || source venv/bin/activate
pip install -r requirements.txt

# 2) Backend env
cp .env.example .env
# Fill keys in .env (see .env.example for names)

# 3) Frontend deps
cd ../frontend
npm ci
cp .env.example .env.local
# Fill frontend env

# 4) Run services (in three terminals)

# (A) RabbitMQ — make sure it's running locally
# Windows: ensure RabbitMQ service is started
# macOS (brew): brew services start rabbitmq

# (B) Backend API (run from podcast-pro-plus/)
cd ../podcast-pro-plus
source venv/Scripts/activate 2>/dev/null || source venv/bin/activate
uvicorn api.main:app --reload

# (C) Celery worker (Windows requires --pool=solo)
celery -A worker.tasks.celery_app worker --pool=solo --loglevel=info

# (D) Frontend (run from frontend/)
cd ../frontend
npm run dev
Important: Run uvicorn from the podcast-pro-plus/ directory so Python resolves the api.* package correctly.
If you must run from repo root, set: PYTHONPATH=podcast-pro-plus.

Environment
Backend env file: podcast-pro-plus/.env (see .env.example)

Frontend env file: frontend/.env.local (see .env.example)

Must-have keys (backend):

SECRET_KEY (for SessionMiddleware — required for Google OAuth)

OpenAI / ElevenLabs API keys

Spreaker OAuth client creds and redirect URI

Google OAuth client creds and redirect URI

RABBITMQ_URL

Smoke test (manual)
Start backend, Celery worker, frontend, RabbitMQ.

Connect Spreaker via Settings → ensure /api/spreaker/shows returns 200 and {shows:[...]}.

Upload audio: /api/media/upload/main_content (via UI). Should return JSON with filename.

Upload episode cover: /api/media/upload/episode_cover.
⚠️ Use episode_cover (not cover_art) or you’ll get 422.

Assemble: call Assemble (UI) → backend returns {job_id}.

Poll /api/episodes/status/{job_id} until processed and episode.id present.

Publish: UI calls POST /api/episodes/{id}/publish with

json
Copy
Edit
{
  "spreaker_show_id": "<your show id>",
  "publish_state": "unpublished",           // or "public"
  "description": "Episode description here" // required if you want it on Spreaker
}
Confirm:

episode.spreaker_episode_id set

is_published_to_spreaker = 1

Description/image visible on Spreaker

Episode appears in Episode History list (sorted newest-first)

Common pitfalls (and how to avoid them)
SessionMiddleware assertion:
Error “…SessionMiddleware must be installed…” → ensure SECRET_KEY is set in .env and the app adds SessionMiddleware (already wired). Restart after setting the key.

ModuleNotFoundError: api.core.auth:
Launch the API from podcast-pro-plus/ or set PYTHONPATH=podcast-pro-plus.

422 on cover upload:
Use the accepted category names. For episode art, it must be episode_cover.

Spreaker shows dropdown blank:
/api/spreaker/shows 500s if user isn’t connected or SpreakerClient.get_shows is missing. Ensure user has a valid spreaker_access_token.

Description/image missing on Spreaker:
Frontend must send description in publish body; backend must pass it through to SpreakerClient.upload_episode. For image, send the local file path derived from episode.cover_path or fallback to the show’s cover.

Publish status confusion:
On success, update:

episode.is_published_to_spreaker = True

episode.spreaker_episode_id = returned id
Keep status = "processed" (assembly status). If you introduce a "published" status, coordinate with FE first.

Coding standards
Python: black/isort (not enforced in repo; follow standard)

JS/TS: Prettier (Vite defaults)

Commit style: Conventional commits suggested (feat:, fix:, docs:, etc.)

Branch & PR workflow
Branch from chatgpt5:

feat/<short-description> or fix/<short-description>

Open PR with:

Summary of changes

Risks & migrations (if any)

Smoke test checklist results (above)

Screenshots for UI changes

API compatibility contract (copy-paste)
GET /api/spreaker/shows
Response

json
Copy
Edit
{ "shows": [ { "show_id": 6705116, "title": "Name", "...": "..." } ] }
POST /api/media/upload/{category}
category ∈ { "intro","outro","music","commercial","sfx","main_content","podcast_cover","episode_cover" }
Response

json
Copy
Edit
[ { "filename": "82ba..._myfile.mp3", "friendly_name": "My File.mp3", "category": "main_content" } ]
POST /api/episodes/assemble
json
Copy
Edit
{
  "template_id": "<uuid>",
  "main_content_filename": "<string>",
  "output_filename": "slugified-title",
  "tts_values": { "<segment-id>": "text" },
  "episode_details": {
    "title": "My Title",
    "season": "1",
    "episodeNumber": "12",
    "description": "Episode description",
    "cover_image_path": "<filename from episode_cover upload>"
  }
}
Response

json
Copy
Edit
{ "job_id": "<celery-id>" }
GET /api/episodes/status/{job_id}
Response

json
Copy
Edit
{ "status": "processing" }
{ "status": "queued" }
{ "status": "processed", "episode": { "id": "<uuid>" }, "message": "Episode assembled successfully!" }
{ "status": "error", "error": "..." }
POST /api/episodes/{episode_id}/publish (alias must exist)
json
Copy
Edit
{
  "spreaker_show_id": "6705116",
  "publish_state": "unpublished",
  "description": "Episode notes here"
}
Response

json
Copy
Edit
{ "message": "Episode uploaded to Spreaker", "spreaker_episode_id": 12345678 }
Backups & rollback
SQLite (podcast-pro-plus/database.db) and templates.json are not auto-backed up.

Before schema changes, copy database.db somewhere safe.

Rollback: revert PR + restore DB copy if necessary.

Performance
Uploads are multipart (no chunking).

Long processing runs in Celery; ensure the worker is up before assembling.

If you need to change contracts, introduce aliases and mark old ones as deprecated in this doc before removing them.
