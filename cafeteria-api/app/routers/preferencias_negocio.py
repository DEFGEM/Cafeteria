from fastapi import APIRouter, Depends
from pydantic import JsonValue
from sqlalchemy.orm import Session

from app.auth.permissions import requiere_roles
from app.database import get_db
from app.schemas.preferencia_negocio import (
    PreferenciaNegocioResponse,
    PreferenciaNegocioBatchItem,
    PreferenciaNegocioUpdate,
    PreferenciasNegocioBatchUpdate,
)
from app.services.preferencia_negocio_service import PreferenciaNegocioService


ROLES = ("administrador", "mesero", "cocina", "caja")
router = APIRouter(prefix="/preferencias", tags=["Preferencias de negocio"])


@router.get("/", response_model=dict[str, JsonValue])
def listar_preferencias(
    prefijo: str | None = None,
    usuario=Depends(requiere_roles(*ROLES)),
    db: Session = Depends(get_db),
):
    preferencias = PreferenciaNegocioService.listar(db, prefijo=prefijo)
    return {preferencia.clave: preferencia.valor for preferencia in preferencias}


@router.put("/", response_model=dict[str, JsonValue])
def guardar_mapa_preferencias(
    datos: dict[str, JsonValue],
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    items = [
        PreferenciaNegocioBatchItem(clave=clave, valor=valor)
        for clave, valor in datos.items()
    ]
    preferencias = PreferenciaNegocioService.guardar_lote(
        db,
        items,
        usuario["id"],
    )
    return {preferencia.clave: preferencia.valor for preferencia in preferencias}


@router.get("/detalle", response_model=list[PreferenciaNegocioResponse])
def listar_preferencias_con_detalle(
    prefijo: str | None = None,
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    return PreferenciaNegocioService.listar(db, prefijo=prefijo)


@router.put("/lote", response_model=list[PreferenciaNegocioResponse])
def guardar_preferencias_en_lote(
    datos: PreferenciasNegocioBatchUpdate,
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    return PreferenciaNegocioService.guardar_lote(
        db,
        datos.preferencias,
        usuario["id"],
    )


@router.get("/{clave}", response_model=PreferenciaNegocioResponse)
def obtener_preferencia(
    clave: str,
    usuario=Depends(requiere_roles(*ROLES)),
    db: Session = Depends(get_db),
):
    return PreferenciaNegocioService.obtener(db, clave)


@router.put("/{clave}", response_model=PreferenciaNegocioResponse)
def guardar_preferencia(
    clave: str,
    datos: PreferenciaNegocioUpdate,
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    return PreferenciaNegocioService.guardar(db, clave, datos, usuario["id"])
