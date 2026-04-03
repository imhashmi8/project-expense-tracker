from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ExpenseFlow API"
    debug: bool = False
    jwt_secret: str = Field(default="please-change-me", alias="JWT_SECRET")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = Field(default=120, alias="JWT_EXPIRE_MINUTES")
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/expenseflow",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    frontend_origins: str = Field(default="http://localhost:3000", alias="FRONTEND_ORIGINS")
    seed_demo_data: bool = Field(default=True, alias="SEED_DEMO_DATA")
    azure_blob_connection_string: str | None = Field(default=None, alias="AZURE_BLOB_CONNECTION_STRING")
    azure_blob_container: str = Field(default="expense-receipts", alias="AZURE_BLOB_CONTAINER")
    local_uploads_dir: str = Field(default="uploads", alias="LOCAL_UPLOADS_DIR")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]

    @property
    def backend_dir(self) -> Path:
        return Path(__file__).resolve().parents[2]

    @property
    def uploads_dir_path(self) -> Path:
        return self.backend_dir / self.local_uploads_dir


@lru_cache
def get_settings() -> Settings:
    return Settings()
