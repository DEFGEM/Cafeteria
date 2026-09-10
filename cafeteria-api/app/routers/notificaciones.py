from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.permissions import requiere_roles
from app.database import get_db
from app.schemas.notificacion import (
    ConteoNotificacionesResponse,
    NotificacionCreate,
    NotificacionResponse,
)
from app.services.notificacion_service import NotificacionService


ROLES = ("administrador", "mesero", "cocina", "caja")
router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@router.get("/no-leidas/conteo", response_model=ConteoNotificacionesResponse)
def contar_notificaciones_no_leidas(
    usuario=Depends(requiere_roles(*ROLES)),
    db: Session = Depends(get_db),
):
    return {
        "no_leidas": NotificacionService.contar_no_leidas(
            db,
            id_usuario=usuario["id"],
            rol=usuario["rol"],
        )
    }


@router.get("/", response_model=list[NotificacionResponse])
def listar_notificaciones(
    solo_no_leidas: bool = False,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    usuario=Depends(requiere_roles(*ROLES)),
    db: Session = Depends(get_db),
):
    return NotificacionService.listar_para_usuario(
        db,
        id_usuario=usuario["id"],
        rol=usuario["rol"],
        solo_no_leidas=solo_no_leidas,
        skip=skip,
        limit=limit,
    )


@router.post(
    "/",
    response_model=NotificacionResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_notificacion(
    datos: NotificacionCreate,
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    return NotificacionService.crear(db, datos, usuario["id"])


@router.put("/{id_notificacion}/leer", response_model=NotificacionResponse)
def marcar_notificacion_leida(
    id_notificacion: int,
    usuario=Depends(requiere_roles(*ROLES)),
    db: Session = Depends(get_db),
):
    return NotificacionService.marcar_leida(
        db,
        id_notificacion,
        id_usuario=usuario["id"],
        rol=usuario["rol"],
    )
