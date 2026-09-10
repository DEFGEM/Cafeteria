from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.estadisticas_service import EstadisticasService
from app.auth.permissions import requiere_roles

router = APIRouter(
    prefix="/estadisticas",
    tags=["Estadísticas"]
)


@router.get("/")
def dashboard(
    usuario=Depends(
        requiere_roles("administrador")
    ),
    db: Session = Depends(get_db)
):
    return EstadisticasService.dashboard(db)
