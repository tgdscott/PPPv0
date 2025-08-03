from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # This tells Pydantic to load variables from a .env file
    OPENAI_API_KEY: str = "YOUR_API_KEY_HERE"
    ELEVENLABS_API_KEY: str = "YOUR_API_KEY_HERE"
    SPREAKER_API_TOKEN: str = "YOUR_SPREAKER_TOKEN_HERE"

    # --- Google OAuth Settings ---
    GOOGLE_CLIENT_ID: str = "YOUR_GOOGLE_CLIENT_ID"
    GOOGLE_CLIENT_SECRET: str = "YOUR_GOOGLE_CLIENT_SECRET"

    # --- JWT Authentication Settings ---
    SECRET_KEY: str = "YOUR_SECRET_KEY_HERE"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # --- NEW: Admin User Setting ---
    ADMIN_EMAIL: str = "admin@example.com" # Default value if not in .env

    class Config:
        env_file = ".env"

# Create an instance of the settings
settings = Settings()
