from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.permissions import requiere_roles
from app.database import get_db
from app.schemas.actividad import EventoAuditoriaResponse
from app.services.actividad_service import ActividadService


router = APIRouter(prefix="/actividad", tags=["Actividad y auditoría"])


@router.get("/", response_model=list[EventoAuditoriaResponse])
def listar_actividad(
    modulo: str | None = None,
    accion: str | None = None,
    id_usuario: int | None = Query(default=None, gt=0),
    fecha_inicio: datetime | None = None,
    fecha_fin: datetime | None = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    return ActividadService.listar(
        db,
        modulo=modulo,
        accion=accion,
        id_usuario=id_usuario,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        skip=skip,
        limit=limit,
    )
