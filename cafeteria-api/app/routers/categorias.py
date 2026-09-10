from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.categoria import (
    CategoriaCreate,
    CategoriaResponse,
    CategoriaUpdate
)
from app.services.categoria_service import CategoriaService

from app.auth.permissions import requiere_roles

from app.schemas.categoria import CategoriaUpdate

router = APIRouter(
    prefix="/categorias",
    tags=["Categorías"]
)


@router.get("/", response_model=list[CategoriaResponse])
def listar_categorias(
    usuario=Depends(
        requiere_roles("administrador", "cocina")
    ),
    db: Session = Depends(get_db)
):
    return CategoriaService.listar(db)


@router.get("/{id_categoria}", response_model=CategoriaResponse)
def obtener_categoria(
    id_categoria: int,
    usuario=Depends(
        requiere_roles("administrador", "cocina")
    ),
    db: Session = Depends(get_db)
):
    return CategoriaService.obtener(db, id_categoria)


@router.post("/", response_model=CategoriaResponse)
def crear_categoria(
    datos: CategoriaCreate,
    usuario=Depends(
        requiere_roles("administrador")
    ),
    db: Session = Depends(get_db)
):
    return CategoriaService.crear(db, datos)


@router.delete("/{id_categoria}")
def eliminar_categoria(
    id_categoria: int,
    usuario=Depends(
        requiere_roles("administrador")
    ),
    db: Session = Depends(get_db)
):
    CategoriaService.eliminar(db, id_categoria)

    return {
        "mensaje": "Categoría eliminada correctamente"
    }

@router.put(
    "/{id_categoria}",
    response_model=CategoriaResponse
)
def actualizar_categoria(
    id_categoria: int,
    datos: CategoriaUpdate,
    usuario=Depends(
        requiere_roles("administrador")
    ),
    db: Session = Depends(get_db)
):

    return CategoriaService.actualizar(
        db,
        id_categoria,
        datos
    )
