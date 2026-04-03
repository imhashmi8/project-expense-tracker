from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal, engine
from app.db.base import Base
from app.db.seed import seed_demo_data
from app.models import Budget, Expense, Notification, Organization, User

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
    return JSONResponse({"status": "ok", "service": settings.app_name})
