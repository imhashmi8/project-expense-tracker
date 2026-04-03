from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import TypeAdapter
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import Budget, Expense, ExpenseStatus, Role, User
from app.schemas.dtos import AnalyticsOverview, BudgetPerformance, CategoryBreakdown
from app.services.cache import cache

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _scope_key(current_user: User, personal_only: bool) -> str:
    return f"{current_user.organization_id}:{current_user.id if personal_only else 'org'}"


@router.get("/overview", response_model=AnalyticsOverview)
async def overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsOverview:
    personal_only = current_user.role == Role.EMPLOYEE
    cache_key = f"analytics:{_scope_key(current_user, personal_only)}:overview"

    cached = await cache.get_json(cache_key)
    if cached:
        return TypeAdapter(AnalyticsOverview).validate_python(cached)

    filters = [Expense.organization_id == current_user.organization_id]
    if personal_only:
        filters.append(Expense.owner_id == current_user.id)

    expense_result = await db.execute(
        select(Expense)
        .options(selectinload(Expense.owner))
        .where(*filters)
        .order_by(Expense.spent_at.asc())
    )
    expenses = list(expense_result.scalars().all())

    budgets = await db.execute(
        select(Budget).where(
            Budget.organization_id == current_user.organization_id,
            Budget.month_start == datetime.utcnow().date().replace(day=1),
        )
    )
    budget_rows = list(budgets.scalars().all())

    total_spend = sum(float(expense.amount) for expense in expenses)
    approved_spend = sum(float(expense.amount) for expense in expenses if expense.status == ExpenseStatus.APPROVED)
    pending_expenses = sum(1 for expense in expenses if expense.status == ExpenseStatus.PENDING)

    trend_map: dict[str, float] = defaultdict(float)
    category_map: dict[str, float] = defaultdict(float)
    for expense in expenses:
        trend_map[expense.spent_at.strftime("%b %Y")] += float(expense.amount)
        category_map[expense.category] += float(expense.amount)

    trend = [
        {"month": month, "amount": amount}
        for month, amount in sorted(
            trend_map.items(),
            key=lambda item: datetime.strptime(item[0], "%b %Y"),
        )
    ]
    category_breakdown = [
        CategoryBreakdown(category=category, total=total)
        for category, total in sorted(category_map.items(), key=lambda item: item[1], reverse=True)[:6]
    ]

    category_totals = {item.category: item.total for item in category_breakdown}
    budget_performance = [
        BudgetPerformance(
            category=budget.category,
            budget_limit=float(budget.monthly_limit),
            spent=category_totals.get(budget.category, 0),
            remaining=max(float(budget.monthly_limit) - category_totals.get(budget.category, 0), 0),
            utilization_percent=round((category_totals.get(budget.category, 0) / float(budget.monthly_limit)) * 100, 1)
            if float(budget.monthly_limit) > 0
            else 0,
        )
        for budget in budget_rows
    ]

    if personal_only:
        team_members = 1
    else:
        team_members = await db.scalar(select(func.count(User.id)).where(User.organization_id == current_user.organization_id)) or 0

    response = AnalyticsOverview(
        total_spend=total_spend,
        pending_expenses=pending_expenses,
        approved_spend=approved_spend,
        team_members=int(team_members),
        trend=trend,
        category_breakdown=category_breakdown,
        budget_performance=budget_performance,
    )
    await cache.set_json(cache_key, response.model_dump(mode="json"))
    return response
