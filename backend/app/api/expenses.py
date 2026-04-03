from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import Expense, ExpenseStatus, Role, User
from app.schemas.dtos import ExpenseCreate, ExpenseRead, ExpenseUpdate
from app.services.cache import cache
from app.services.notifications import notification_service

router = APIRouter(prefix="/expenses", tags=["Expenses"])


async def get_expense_or_404(db: AsyncSession, expense_id: int, organization_id: int) -> Expense:
    result = await db.execute(
        select(Expense).options(selectinload(Expense.owner)).where(Expense.id == expense_id, Expense.organization_id == organization_id)
    )
    expense = result.scalar_one_or_none()
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.get("", response_model=list[ExpenseRead])
async def list_expenses(
    limit: int = Query(default=20, ge=1, le=100),
    status_filter: ExpenseStatus | None = None,
    mine: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ExpenseRead]:
    statement = (
        select(Expense)
        .options(selectinload(Expense.owner))
        .where(Expense.organization_id == current_user.organization_id)
        .order_by(Expense.spent_at.desc())
        .limit(limit)
    )
    if current_user.role == Role.EMPLOYEE or mine:
        statement = statement.where(Expense.owner_id == current_user.id)
    if status_filter:
        statement = statement.where(Expense.status == status_filter)

    result = await db.execute(statement)
    return list(result.scalars().all())


@router.post("", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
async def create_expense(
    payload: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseRead:
    expense = Expense(
        organization_id=current_user.organization_id,
        owner_id=current_user.id,
        title=payload.title,
        category=payload.category,
        amount=payload.amount,
        currency=payload.currency,
        spent_at=payload.spent_at,
        notes=payload.notes,
        receipt_url=payload.receipt_url,
    )
    db.add(expense)
    await db.commit()

    created_expense = await get_expense_or_404(db, expense.id, current_user.organization_id)
    reviewers_result = await db.execute(
        select(User).where(
            User.organization_id == current_user.organization_id,
            User.role.in_([Role.ADMIN, Role.MANAGER]),
            User.id != current_user.id,
        )
    )
    await notification_service.send_to_users(
        db,
        list(reviewers_result.scalars().all()),
        type_="expense_submitted",
        message=f"{current_user.full_name} submitted '{expense.title}' for approval.",
    )
    await cache.delete_pattern(f"analytics:{current_user.organization_id}:*")
    return created_expense


@router.get("/{expense_id}", response_model=ExpenseRead)
async def get_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseRead:
    expense = await get_expense_or_404(db, expense_id, current_user.organization_id)
    if current_user.role == Role.EMPLOYEE and expense.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to view this expense")
    return expense


@router.patch("/{expense_id}", response_model=ExpenseRead)
async def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseRead:
    expense = await get_expense_or_404(db, expense_id, current_user.organization_id)
    is_owner = expense.owner_id == current_user.id
    can_review = current_user.role in {Role.ADMIN, Role.MANAGER}

    if not is_owner and not can_review:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to update this expense")

    if payload.status is not None and not can_review:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers and admins can review expenses")

    if is_owner and not can_review and expense.status != ExpenseStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending expenses can be edited")

    for field_name in ["title", "category", "amount", "spent_at", "notes", "receipt_url"]:
        value = getattr(payload, field_name)
        if value is not None:
            setattr(expense, field_name, value)

    status_changed = payload.status is not None and payload.status != expense.status
    if payload.status is not None:
        expense.status = payload.status

    await db.commit()
    updated = await get_expense_or_404(db, expense.id, current_user.organization_id)

    if status_changed:
        owner = await db.get(User, expense.owner_id)
        if owner:
            await notification_service.send_to_users(
                db,
                [owner],
                type_="expense_reviewed",
                message=f"'{expense.title}' was marked as {expense.status.value}.",
            )
    await cache.delete_pattern(f"analytics:{current_user.organization_id}:*")
    return updated


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    expense = await get_expense_or_404(db, expense_id, current_user.organization_id)
    if current_user.role == Role.EMPLOYEE and expense.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to delete this expense")

    await db.delete(expense)
    await db.commit()
    await cache.delete_pattern(f"analytics:{current_user.organization_id}:*")
    return None
