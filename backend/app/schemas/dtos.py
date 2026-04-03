from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import ExpenseStatus, Role


class OrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    full_name: str
    email: EmailStr
    role: Role
    title: str
    team_name: str
    is_active: bool


class RegisterRequest(BaseModel):
    organization_name: str = Field(min_length=3, max_length=120)
    full_name: str = Field(min_length=3, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)


class CreateUserRequest(BaseModel):
    full_name: str = Field(min_length=3, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)
    role: Role = Role.EMPLOYEE
    title: str = Field(default="Team Member", max_length=120)
    team_name: str = Field(default="Finance Ops", max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
    organization: OrganizationRead


class BudgetCreate(BaseModel):
    category: str = Field(min_length=2, max_length=80)
    month_start: date
    monthly_limit: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class BudgetUpdate(BaseModel):
    monthly_limit: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class BudgetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    category: str
    month_start: date
    monthly_limit: Decimal


class ExpenseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=140)
    category: str = Field(min_length=2, max_length=80)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    currency: str = Field(default="INR", max_length=8)
    spent_at: datetime
    notes: str | None = Field(default=None, max_length=500)
    receipt_url: str | None = Field(default=None, max_length=255)


class ExpenseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=140)
    category: str | None = Field(default=None, min_length=2, max_length=80)
    amount: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    spent_at: datetime | None = None
    notes: str | None = Field(default=None, max_length=500)
    receipt_url: str | None = Field(default=None, max_length=255)
    status: ExpenseStatus | None = None


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    owner_id: int
    title: str
    category: str
    amount: Decimal
    currency: str
    status: ExpenseStatus
    spent_at: datetime
    notes: str | None
    receipt_url: str | None
    created_at: datetime
    updated_at: datetime
    owner: UserRead


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    message: str
    is_read: bool
    created_at: datetime


class AnalyticsTrendPoint(BaseModel):
    month: str
    amount: float


class CategoryBreakdown(BaseModel):
    category: str
    total: float


class BudgetPerformance(BaseModel):
    category: str
    budget_limit: float
    spent: float
    remaining: float
    utilization_percent: float


class AnalyticsOverview(BaseModel):
    total_spend: float
    pending_expenses: int
    approved_spend: float
    team_members: int
    trend: list[AnalyticsTrendPoint]
    category_breakdown: list[CategoryBreakdown]
    budget_performance: list[BudgetPerformance]


class TeamReportRow(BaseModel):
    user_id: int
    full_name: str
    email: EmailStr
    role: Role
    submitted_count: int
    approved_total: float
    pending_total: float


class TeamReportResponse(BaseModel):
    generated_at: datetime
    rows: list[TeamReportRow]
    top_categories: list[CategoryBreakdown]


class UploadResponse(BaseModel):
    url: str
