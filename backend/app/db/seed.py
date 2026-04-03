from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models import Budget, Expense, ExpenseStatus, Organization, Role, User


async def seed_demo_data(session: AsyncSession) -> None:
    existing_user = await session.scalar(select(User.id).limit(1))
    if existing_user:
        return

    organization = Organization(name="Northstar Finance", slug="northstar-finance")
    admin = User(
        organization=organization,
        full_name="Ava Thompson",
        email="admin@northstar.dev",
        password_hash=hash_password("Admin@123"),
        role=Role.ADMIN,
        title="Finance Director",
        team_name="Leadership",
    )
    manager = User(
        organization=organization,
        full_name="Marcus Lee",
        email="manager@northstar.dev",
        password_hash=hash_password("Manager@123"),
        role=Role.MANAGER,
        title="Ops Manager",
        team_name="Operations",
    )
    employee = User(
        organization=organization,
        full_name="Riya Patel",
        email="employee@northstar.dev",
        password_hash=hash_password("Employee@123"),
        role=Role.EMPLOYEE,
        title="Business Analyst",
        team_name="Operations",
    )

    now = datetime.now(timezone.utc)
    month_start = date.today().replace(day=1)

    session.add_all([organization, admin, manager, employee])
    await session.flush()

    budgets = [
        Budget(
            organization=organization,
            category="Travel",
            month_start=month_start,
            monthly_limit=Decimal("7000"),
            created_by=admin.id,
        ),
        Budget(
            organization=organization,
            category="Software",
            month_start=month_start,
            monthly_limit=Decimal("3200"),
            created_by=admin.id,
        ),
        Budget(
            organization=organization,
            category="Meals",
            month_start=month_start,
            monthly_limit=Decimal("1400"),
            created_by=admin.id,
        ),
    ]
    expenses = [
        Expense(
            organization=organization,
            owner=employee,
            title="Client travel to Bengaluru",
            category="Travel",
            amount=Decimal("1260.50"),
            currency="INR",
            status=ExpenseStatus.APPROVED,
            spent_at=now - timedelta(days=25),
            notes="Flight and local commute",
        ),
        Expense(
            organization=organization,
            owner=employee,
            title="Team lunch",
            category="Meals",
            amount=Decimal("140.00"),
            currency="INR",
            status=ExpenseStatus.PENDING,
            spent_at=now - timedelta(days=7),
            notes="Quarterly planning lunch",
        ),
        Expense(
            organization=organization,
            owner=manager,
            title="Figma enterprise renewal",
            category="Software",
            amount=Decimal("880.00"),
            currency="INR",
            status=ExpenseStatus.APPROVED,
            spent_at=now - timedelta(days=12),
            notes="Annual design license",
        ),
    ]

    session.add_all([*budgets, *expenses])
    await session.commit()
