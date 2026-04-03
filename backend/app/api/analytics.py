from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import TypeAdapter
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

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

    totals = await db.execute(
        select(
            func.coalesce(func.sum(Expense.amount), 0).label("total_spend"),
            func.coalesce(
                func.sum(case((Expense.status == ExpenseStatus.APPROVED, Expense.amount), else_=0)),
                0,
            ).label("approved_spend"),
            func.coalesce(
                func.sum(case((Expense.status == ExpenseStatus.PENDING, 1), else_=0)),
                0,
            ).label("pending_count"),
        ).where(*filters)
    )
    totals_row = totals.one()

    trend_result = await db.execute(
        select(
            func.date_trunc("month", Expense.spent_at).label("month"),
            func.coalesce(func.sum(Expense.amount), 0).label("amount"),
        )
        .where(*filters)
        .group_by(func.date_trunc("month", Expense.spent_at))
        .order_by(func.date_trunc("month", Expense.spent_at))
    )

    category_result = await db.execute(
        select(Expense.category, func.coalesce(func.sum(Expense.amount), 0).label("total"))
        .where(*filters)
        .group_by(Expense.category)
        .order_by(func.coalesce(func.sum(Expense.amount), 0).desc())
        .limit(6)
    )
    trend_rows = list(trend_result)
    category_rows = list(category_result)

    budgets = await db.execute(
        select(Budget).where(
            Budget.organization_id == current_user.organization_id,
            Budget.month_start == datetime.utcnow().date().replace(day=1),
        )
    )
    budget_rows = list(budgets.scalars().all())

    category_totals = {row.category: float(row.total or 0) for row in category_rows}
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
        total_spend=float(totals_row.total_spend or 0),
        pending_expenses=int(totals_row.pending_count or 0),
        approved_spend=float(totals_row.approved_spend or 0),
        team_members=int(team_members),
        trend=[
            {
                "month": row.month.strftime("%b %Y"),
                "amount": float(row.amount or 0),
            }
            for row in trend_rows
            if row.month
        ],
        category_breakdown=[
            CategoryBreakdown(category=row.category, total=float(row.total or 0)) for row in category_rows if row.category
        ],
        budget_performance=budget_performance,
    )
    await cache.set_json(cache_key, response.model_dump(mode="json"))
    return response
