from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.dashboard_service import DashboardService
from app.auth.permissions import requiere_roles

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/")
def dashboard(
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db)
):

    return DashboardService.obtener(db)