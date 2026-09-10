from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.permissions import requiere_roles
from app.database import get_db
from app.schemas.promocion import PromocionCreate, PromocionResponse, PromocionUpdate
from app.services.promocion_service import PromocionService


router = APIRouter(prefix="/promociones", tags=["Promociones"])


@router.get("/activas", response_model=list[PromocionResponse])
def listar_promociones_activas(
    id_producto: int | None = Query(default=None, gt=0),
    usuario=Depends(
        requiere_roles("administrador", "mesero", "cocina", "caja")
    ),
    db: Session = Depends(get_db),
):
    return PromocionService.listar_activas(db, id_producto=id_producto)


@router.get("/", response_model=list[PromocionResponse])
def listar_promociones(
    activo: bool | None = None,
    id_producto: int | None = Query(default=None, gt=0),
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    return PromocionService.listar(
        db,
        activo=activo,
        id_producto=id_producto,
        skip=skip,
        limit=limit,
    )


@router.post("/", response_model=PromocionResponse, status_code=status.HTTP_201_CREATED)
def crear_promocion(
    datos: PromocionCreate,
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    return PromocionService.crear(db, datos, usuario["id"])


@router.get("/{id_promocion}", response_model=PromocionResponse)
def obtener_promocion(
    id_promocion: int,
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    return PromocionService.obtener(db, id_promocion)


@router.put("/{id_promocion}", response_model=PromocionResponse)
def actualizar_promocion(
    id_promocion: int,
    datos: PromocionUpdate,
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    return PromocionService.actualizar(db, id_promocion, datos, usuario["id"])


@router.delete("/{id_promocion}", response_model=PromocionResponse)
def eliminar_promocion(
    id_promocion: int,
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    return PromocionService.eliminar(db, id_promocion, usuario["id"])
