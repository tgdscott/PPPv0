from fastapi import FastAPI
from contextlib import asynccontextmanager
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.staticfiles import StaticFiles
import starlette

print(f"Starlette version: {starlette.__version__}")

from .core.database import create_db_and_tables
from .core.config import settings
from .routers import templates, episodes, auth, media, users, admin, podcasts, importer, dev, spreaker, wizard
from worker.tasks import celery_app

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

# Mount the directory for serving uploaded media files
app.mount("/media_uploads", StaticFiles(directory="media_uploads"), name="media_uploads")

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://0985ef59e207.ngrok-free.app",
    "https://59c2e2f840ab.ngrok-free.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(podcasts.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(episodes.router, prefix="/api")
app.include_router(importer.router, prefix="/api")
app.include_router(dev.router, prefix="/api")
app.include_router(spreaker.router, prefix="/api")
app.include_router(wizard.router, prefix="/api/wizard")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Podcast Pro Plus API"}
