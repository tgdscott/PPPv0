from fastapi import FastAPI
from contextlib import asynccontextmanager
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .core.database import create_db_and_tables
from .core.config import settings
from .routers import templates, episodes, auth, media, users, admin, podcasts, importer, dev

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(podcasts.router)
app.include_router(templates.router)
app.include_router(media.router)
app.include_router(episodes.router)
app.include_router(importer.router)
app.include_router(dev.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Podcast Pro Plus API"}