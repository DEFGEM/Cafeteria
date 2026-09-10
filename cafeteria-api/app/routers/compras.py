from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.permissions import requiere_roles
from app.database import get_db
from app.schemas.compra import CompraCreate, CompraResponse, CompraUpdate, EstadoCompra
from app.services.compra_service import CompraService


router = APIRouter(prefix="/compras", tags=["Compras"])


@router.get("/", response_model=list[CompraResponse])
def listar_compras(
    estado_compra: EstadoCompra | None = Query(default=None, alias="estado"),
    proveedor: str | None = None,
    fecha_inicio: datetime | None = None,
    fecha_fin: datetime | None = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    usuario=Depends(requiere_roles("administrador", "caja", "cocina")),
    db: Session = Depends(get_db),
):
    return CompraService.listar(
        db,
        estado=estado_compra.value if estado_compra else None,
        proveedor=proveedor,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        skip=skip,
        limit=limit,
    )


@router.post("/", response_model=CompraResponse, status_code=status.HTTP_201_CREATED)
def crear_compra(
    datos: CompraCreate,
    usuario=Depends(requiere_roles("administrador", "caja")),
    db: Session = Depends(get_db),
):
    return CompraService.crear(db, datos, usuario["id"])


@router.get("/{id_compra}", response_model=CompraResponse)
def obtener_compra(
    id_compra: int,
    usuario=Depends(requiere_roles("administrador", "caja", "cocina")),
    db: Session = Depends(get_db),
):
    return CompraService.obtener(db, id_compra)


@router.put("/{id_compra}", response_model=CompraResponse)
def actualizar_compra(
    id_compra: int,
    datos: CompraUpdate,
    usuario=Depends(requiere_roles("administrador", "caja")),
    db: Session = Depends(get_db),
):
    return CompraService.actualizar(db, id_compra, datos, usuario["id"])


@router.post("/{id_compra}/recibir", response_model=CompraResponse)
def recibir_compra(
    id_compra: int,
    usuario=Depends(requiere_roles("administrador", "caja")),
    db: Session = Depends(get_db),
):
    return CompraService.recibir(db, id_compra, usuario["id"])
