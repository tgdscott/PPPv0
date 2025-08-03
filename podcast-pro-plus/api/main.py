from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from .core.config import settings
from .core.database import create_db_and_tables
from .routers import templates, episodes, auth, media, users, admin, podcasts # Import podcasts

app = FastAPI(
    title="Podcast Pro Plus API",
    description="The backend service for the Podcast Pro Plus application.",
    version="0.1.0",
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()

origins = [
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# Include the routers in the main application
app.include_router(templates.router)
app.include_router(episodes.router)
app.include_router(auth.router)
app.include_router(media.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(podcasts.router) # Add the new podcasts router

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Podcast Pro Plus API!"}
