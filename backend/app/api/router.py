from fastapi import APIRouter

from app.api import analytics, auth, budgets, expenses, notifications, reports, uploads

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(budgets.router)
api_router.include_router(expenses.router)
api_router.include_router(analytics.router)
api_router.include_router(reports.router)
api_router.include_router(notifications.router)
api_router.include_router(uploads.router)
