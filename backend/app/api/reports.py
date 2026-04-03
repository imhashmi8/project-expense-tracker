import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models import Role, User
from app.schemas.dtos import TeamReportResponse
from app.services.reports import build_team_report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/team", response_model=TeamReportResponse)
async def team_report(
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
    db=Depends(get_db),
) -> TeamReportResponse:
    return await build_team_report(db, current_user.organization_id)


@router.get("/team/export", response_class=PlainTextResponse)
async def export_team_report(
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
    db=Depends(get_db),
) -> PlainTextResponse:
    report = await build_team_report(db, current_user.organization_id)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Name", "Email", "Role", "Submitted", "Approved Total", "Pending Total"])
    for row in report.rows:
        writer.writerow([row.full_name, row.email, row.role.value, row.submitted_count, row.approved_total, row.pending_total])
    return PlainTextResponse(buffer.getvalue(), media_type="text/csv")
