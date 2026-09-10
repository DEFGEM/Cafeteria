from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.permissions import requiere_roles
from app.database import get_db
from app.schemas.insumo import (
    InsumoCreate,
    InsumoResponse,
    InsumoUpdate,
    MovimientoInventarioCreate,
    MovimientoInventarioResponse,
)
from app.services.insumo_service import InsumoService


router = APIRouter(prefix="/insumos", tags=["Insumos e inventario"])


@router.get("/stock-bajo", response_model=list[InsumoResponse])
def listar_stock_bajo(
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    usuario=Depends(requiere_roles("administrador", "cocina", "caja")),
    db: Session = Depends(get_db),
):
    return InsumoService.listar(
        db,
        activo=True,
        stock_bajo=True,
        skip=skip,
        limit=limit,
    )


@router.get("/", response_model=list[InsumoResponse])
def listar_insumos(
    nombre: str | None = None,
    categoria: str | None = None,
    activo: bool | None = True,
    stock_bajo: bool | None = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    usuario=Depends(requiere_roles("administrador", "cocina", "caja")),
    db: Session = Depends(get_db),
):
    return InsumoService.listar(
        db,
        nombre=nombre,
        categoria=categoria,
        activo=activo,
        stock_bajo=stock_bajo,
        skip=skip,
        limit=limit,
    )


@router.post("/", response_model=InsumoResponse, status_code=status.HTTP_201_CREATED)
def crear_insumo(
    datos: InsumoCreate,
    usuario=Depends(requiere_roles("administrador", "cocina")),
    db: Session = Depends(get_db),
):
    return InsumoService.crear(db, datos, usuario["id"])


@router.get("/{id_insumo}", response_model=InsumoResponse)
def obtener_insumo(
    id_insumo: int,
    usuario=Depends(requiere_roles("administrador", "cocina", "caja")),
    db: Session = Depends(get_db),
):
    return InsumoService.obtener(db, id_insumo)


@router.put("/{id_insumo}", response_model=InsumoResponse)
def actualizar_insumo(
    id_insumo: int,
    datos: InsumoUpdate,
    usuario=Depends(requiere_roles("administrador", "cocina")),
    db: Session = Depends(get_db),
):
    return InsumoService.actualizar(db, id_insumo, datos, usuario["id"])


@router.delete("/{id_insumo}", response_model=InsumoResponse)
def eliminar_insumo(
    id_insumo: int,
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    return InsumoService.desactivar(db, id_insumo, usuario["id"])


@router.post(
    "/{id_insumo}/movimientos",
    response_model=MovimientoInventarioResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_movimiento(
    id_insumo: int,
    datos: MovimientoInventarioCreate,
    usuario=Depends(requiere_roles("administrador", "cocina")),
    db: Session = Depends(get_db),
):
    return InsumoService.registrar_movimiento(db, id_insumo, datos, usuario["id"])


@router.get(
    "/{id_insumo}/movimientos",
    response_model=list[MovimientoInventarioResponse],
)
def listar_movimientos(
    id_insumo: int,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    usuario=Depends(requiere_roles("administrador", "cocina", "caja")),
    db: Session = Depends(get_db),
):
    return InsumoService.listar_movimientos(
        db,
        id_insumo,
        skip=skip,
        limit=limit,
    )
