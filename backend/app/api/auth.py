import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.core.security import create_access_token, hash_password, verify_password
from app.models import Organization, Role, User
from app.schemas.dtos import AuthResponse, CreateUserRequest, LoginRequest, RegisterRequest, UserRead

router = APIRouter(prefix="/auth", tags=["Authentication"])


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
    return slug or "organization"


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    existing_user = await db.scalar(select(User.id).where(User.email == payload.email.lower()))
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    slug = slugify(payload.organization_name)
    existing_org = await db.scalar(select(Organization.id).where(Organization.slug == slug))
    if existing_org:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Organization already exists")

    organization = Organization(name=payload.organization_name, slug=slug)
    user = User(
        organization=organization,
        full_name=payload.full_name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=Role.ADMIN,
        title="Founder",
        team_name="Leadership",
    )

    db.add_all([organization, user])
    await db.commit()
    await db.refresh(user)
    await db.refresh(organization)

    token = create_access_token(subject=str(user.id), role=user.role.value, organization_id=user.organization_id)
    return AuthResponse(access_token=token, user=user, organization=organization)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    result = await db.execute(
        select(User).options(selectinload(User.organization)).where(User.email == payload.email.lower())
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(subject=str(user.id), role=user.role.value, organization_id=user.organization_id)
    return AuthResponse(access_token=token, user=user, organization=user.organization)


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return current_user


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: CreateUserRequest,
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    if current_user.role == Role.MANAGER and payload.role == Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Managers cannot create admin users")

    existing_user = await db.scalar(select(User.id).where(User.email == payload.email.lower()))
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    user = User(
        organization_id=current_user.organization_id,
        full_name=payload.full_name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        title=payload.title,
        team_name=payload.team_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
