from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import Budget, Role, User
from app.schemas.dtos import BudgetCreate, BudgetRead, BudgetUpdate
from app.services.cache import cache

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("", response_model=list[BudgetRead])
async def list_budgets(
    month_start: date | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BudgetRead]:
    statement = select(Budget).where(Budget.organization_id == current_user.organization_id).order_by(Budget.category.asc())
    if month_start:
        statement = statement.where(Budget.month_start == month_start)

    result = await db.execute(statement)
    return list(result.scalars().all())


@router.post("", response_model=BudgetRead, status_code=status.HTTP_201_CREATED)
async def create_budget(
    payload: BudgetCreate,
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> BudgetRead:
    existing = await db.scalar(
        select(Budget.id).where(
            Budget.organization_id == current_user.organization_id,
            Budget.category == payload.category,
            Budget.month_start == payload.month_start,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Budget already exists for this category and month")

    budget = Budget(
        organization_id=current_user.organization_id,
        category=payload.category,
        month_start=payload.month_start,
        monthly_limit=payload.monthly_limit,
        created_by=current_user.id,
    )
    db.add(budget)
    await db.commit()
    await db.refresh(budget)
    await cache.delete_pattern(f"analytics:{current_user.organization_id}:*")
    return budget


@router.patch("/{budget_id}", response_model=BudgetRead)
async def update_budget(
    budget_id: int,
    payload: BudgetUpdate,
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> BudgetRead:
    budget = await db.get(Budget, budget_id)
    if budget is None or budget.organization_id != current_user.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    budget.monthly_limit = payload.monthly_limit
    await db.commit()
    await db.refresh(budget)
    await cache.delete_pattern(f"analytics:{current_user.organization_id}:*")
    return budget
