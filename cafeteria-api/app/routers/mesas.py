from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.mesa import (
    MesaCreate,
    MesaResponse
)
from app.services.mesa_service import MesaService

from app.auth.permissions import requiere_roles

from app.schemas.mesa import MesaUpdate

from typing import Optional

router = APIRouter(
    prefix="/mesas",
    tags=["Mesas"]
)


@router.get("/", response_model=list[MesaResponse])
def listar_mesas(
    estado: Optional[str] = None,
    capacidad: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "mesero"
        )
    ),
    db: Session = Depends(get_db)
):

    return MesaService.listar(
        db,
        estado,
        capacidad,
        skip,
        limit
    )


@router.get("/estadisticas")
def estadisticas(
    usuario=Depends(
        requiere_roles(
            "administrador",
            "mesero"
        )
    ),
    db: Session = Depends(get_db)
):
    return MesaService.estadisticas(db)


@router.get("/{id_mesa}", response_model=MesaResponse)
def obtener_mesa(
    id_mesa: int,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "mesero"
        )
    ),
    db: Session = Depends(get_db)
):
    return MesaService.obtener(db, id_mesa)


@router.post("/", response_model=MesaResponse)
def crear_mesa(
    datos: MesaCreate,
    usuario=Depends(
        requiere_roles("administrador")
    ),
    db: Session = Depends(get_db)
):
    return MesaService.crear(db, datos)


@router.delete("/{id_mesa}")
def eliminar_mesa(
    id_mesa: int,
    usuario=Depends(
        requiere_roles("administrador")
    ),
    db: Session = Depends(get_db)
):
    MesaService.eliminar(db, id_mesa)

    return {
        "mensaje": "Mesa eliminada correctamente"
    }

@router.put(
    "/{id_mesa}",
    response_model=MesaResponse
)
def actualizar_mesa(
    id_mesa: int,
    datos: MesaUpdate,
    usuario=Depends(
        requiere_roles("administrador")
    ),
    db: Session = Depends(get_db)
):

    return MesaService.actualizar(
        db,
        id_mesa,
        datos
    )
