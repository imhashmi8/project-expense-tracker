from datetime import datetime, timezone

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Expense, ExpenseStatus, User
from app.schemas.dtos import CategoryBreakdown, TeamReportResponse, TeamReportRow


async def build_team_report(db: AsyncSession, organization_id: int) -> TeamReportResponse:
    member_rows = await db.execute(
        select(
            User.id,
            User.full_name,
            User.email,
            User.role,
            func.count(Expense.id).label("submitted_count"),
            func.coalesce(
                func.sum(case((Expense.status == ExpenseStatus.APPROVED, Expense.amount), else_=0)),
                0,
            ).label("approved_total"),
            func.coalesce(
                func.sum(case((Expense.status == ExpenseStatus.PENDING, Expense.amount), else_=0)),
                0,
            ).label("pending_total"),
        )
        .outerjoin(Expense, Expense.owner_id == User.id)
        .where(User.organization_id == organization_id)
        .group_by(User.id)
        .order_by(func.coalesce(func.sum(Expense.amount), 0).desc())
    )

    category_rows = await db.execute(
        select(
            Expense.category,
            func.coalesce(func.sum(Expense.amount), 0).label("total"),
        )
        .where(Expense.organization_id == organization_id)
        .group_by(Expense.category)
        .order_by(func.coalesce(func.sum(Expense.amount), 0).desc())
        .limit(5)
    )

    return TeamReportResponse(
        generated_at=datetime.now(timezone.utc),
        rows=[
            TeamReportRow(
                user_id=row.id,
                full_name=row.full_name,
                email=row.email,
                role=row.role,
                submitted_count=int(row.submitted_count or 0),
                approved_total=float(row.approved_total or 0),
                pending_total=float(row.pending_total or 0),
            )
            for row in member_rows
        ],
        top_categories=[
            CategoryBreakdown(category=row.category, total=float(row.total or 0)) for row in category_rows if row.category
        ],
    )
