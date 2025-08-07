from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # This tells Pydantic to load variables from a .env file
    OPENAI_API_KEY: str = "YOUR_API_KEY_HERE"
    ELEVENLABS_API_KEY: str = "YOUR_API_KEY_HERE"
    SPREAKER_API_TOKEN: str = "YOUR_SPREAKER_TOKEN_HERE"
    SPREAKER_CLIENT_ID: str = "YOUR_SPREAKER_CLIENT_ID"
    SPREAKER_CLIENT_SECRET: str = "YOUR_SPREAKER_CLIENT_SECRET"
    SPREAKER_REDIRECT_URI: str = "http://localhost:8000/api/auth/spreaker/callback"

    # --- Google OAuth Settings ---
    GOOGLE_CLIENT_ID: str = "YOUR_GOOGLE_CLIENT_ID"
    GOOGLE_CLIENT_SECRET: str = "YOUR_GOOGLE_CLIENT_SECRET"

    # --- JWT Authentication Settings ---
    SECRET_KEY: str = "YOUR_SECRET_KEY_HERE"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # --- NEW: Admin User Setting ---
    ADMIN_EMAIL: str = "admin@example.com" # Default value if not in .env

    # --- THIS IS THE ONLY ADDED LINE ---
    SESSION_SECRET_KEY: str = "a_very_secret_key_that_should_be_changed"

    class Config:
        env_file = ".env"
        extra = "ignore"

# Create an instance of the settings
settings = Settings()