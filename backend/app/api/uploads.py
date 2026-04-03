from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.dependencies import get_current_user
from app.models import User
from app.schemas.dtos import UploadResponse
from app.services.storage import storage_service

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/receipt", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> UploadResponse:
    if file.content_type not in {"image/png", "image/jpeg", "application/pdf"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PNG, JPG, and PDF files are allowed")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Files above 5 MB are not allowed")

    _ = current_user.id
    url = await storage_service.upload_receipt(filename=file.filename or "receipt.bin", content=content, content_type=file.content_type)
    return UploadResponse(url=url)
