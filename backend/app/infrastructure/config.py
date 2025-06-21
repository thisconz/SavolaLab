from pydantic import BaseSettings

# --- Configuration class for application settings ---

# Settings class
class Settings(BaseSettings):
    """
    Application settings loaded from environment variables or a .env file.
    """
    # Database and S3 configuration
    DATABASE_URL: str = "postgresql://admin:admin123@localhost:5432/savolalab"
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "admin"
    S3_SECRET_KEY: str = "admin123"
    S3_BUCKET_NAME: str = "savolalab"

    # Application configuration
    APP_NAME: str = "SavolaLab QC+QA Backend"
    APP_VERSION: str = "1.0.0"
    
    # JWT configuration
    JWT_SECRET_KEY: str = "supersecretkey"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    JWT_REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"

settings = Settings()
