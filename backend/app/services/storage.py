import asyncio
import secrets
from pathlib import Path

from azure.storage.blob import BlobServiceClient

from app.core.config import get_settings


class BlobStorageService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def upload_receipt(self, *, filename: str, content: bytes, content_type: str | None = None) -> str:
        if self.settings.azure_blob_connection_string:
            return await asyncio.to_thread(self._upload_to_blob, filename, content, content_type)
        return await asyncio.to_thread(self._upload_to_local, filename, content)

    def _upload_to_blob(self, filename: str, content: bytes, content_type: str | None = None) -> str:
        blob_service = BlobServiceClient.from_connection_string(self.settings.azure_blob_connection_string)
        container = blob_service.get_container_client(self.settings.azure_blob_container)
        try:
            container.create_container()
        except Exception:
            pass

        safe_name = f"{secrets.token_hex(6)}-{filename}"
        blob_client = container.get_blob_client(safe_name)
        blob_client.upload_blob(
            content,
            overwrite=True,
            content_type=content_type,
        )
        return blob_client.url

    def _upload_to_local(self, filename: str, content: bytes) -> str:
        uploads_dir = self.settings.uploads_dir_path
        uploads_dir.mkdir(parents=True, exist_ok=True)

        safe_name = f"{secrets.token_hex(6)}-{Path(filename).name}"
        path = uploads_dir / safe_name
        path.write_bytes(content)
        return f"/uploads/{safe_name}"


storage_service = BlobStorageService()
