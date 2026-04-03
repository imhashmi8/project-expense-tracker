from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal, engine
from app.db.base import Base
from app.db.seed import seed_demo_data
from app.models import Budget, Expense, Notification, Organization, User
from app.services.cache import cache
from app.services.storage import storage_service

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.uploads_dir_path.mkdir(parents=True, exist_ok=True)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    if settings.seed_demo_data:
        async with AsyncSessionLocal() as session:
            await seed_demo_data(session)
    yield


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


app.include_router(api_router, prefix="/api")
app.mount("/uploads", StaticFiles(directory=str(settings.uploads_dir_path)), name="uploads")


@app.get("/health")
async def healthcheck() -> JSONResponse:
    _ = (Budget, Expense, Notification, Organization, User)
    checks = {
        "backend": "connected",
        "database": "not_connected",
        "redis": "not_connected",
        "blob_storage": "not_connected",
    }

    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        checks["database"] = "connected"
    except Exception:
        pass

    if await cache.ping():
        checks["redis"] = "connected"

    if await storage_service.healthcheck():
        checks["blob_storage"] = "connected"

    overall_status = "ok" if all(value == "connected" for value in checks.values()) else "degraded"
    status_code = 200 if overall_status == "ok" else 503

    return JSONResponse(
        status_code=status_code,
        content={
            "status": overall_status,
            "service": settings.app_name,
            "checks": checks,
        },
    )
