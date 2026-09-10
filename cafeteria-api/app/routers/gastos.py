from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.permissions import requiere_roles
from app.database import get_db
from app.schemas.gasto import GastoCreate, GastoResponse, GastoUpdate
from app.services.gasto_service import GastoService


router = APIRouter(prefix="/gastos", tags=["Gastos"])


@router.get("/", response_model=list[GastoResponse])
def listar_gastos(
    categoria: str | None = None,
    fecha_inicio: datetime | None = None,
    fecha_fin: datetime | None = None,
    incluir_eliminados: bool = False,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    usuario=Depends(requiere_roles("administrador", "caja")),
    db: Session = Depends(get_db),
):
    return GastoService.listar(
        db,
        categoria=categoria,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        incluir_eliminados=incluir_eliminados,
        skip=skip,
        limit=limit,
    )


@router.post("/", response_model=GastoResponse, status_code=status.HTTP_201_CREATED)
def crear_gasto(
    datos: GastoCreate,
    usuario=Depends(requiere_roles("administrador", "caja")),
    db: Session = Depends(get_db),
):
    return GastoService.crear(db, datos, usuario["id"])


@router.get("/{id_gasto}", response_model=GastoResponse)
def obtener_gasto(
    id_gasto: int,
    usuario=Depends(requiere_roles("administrador", "caja")),
    db: Session = Depends(get_db),
):
    return GastoService.obtener(db, id_gasto)


@router.put("/{id_gasto}", response_model=GastoResponse)
def actualizar_gasto(
    id_gasto: int,
    datos: GastoUpdate,
    usuario=Depends(requiere_roles("administrador", "caja")),
    db: Session = Depends(get_db),
):
    return GastoService.actualizar(db, id_gasto, datos, usuario["id"])


@router.delete("/{id_gasto}", response_model=GastoResponse)
def eliminar_gasto(
    id_gasto: int,
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    return GastoService.eliminar(db, id_gasto, usuario["id"])
