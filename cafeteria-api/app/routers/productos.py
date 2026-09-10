from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.producto import (
    ProductoCreate,
    ProductoResponse
)
from app.services.producto_service import ProductoService

from app.auth.permissions import requiere_roles

from app.schemas.producto import ProductoUpdate

from typing import Optional

from fastapi import HTTPException

import os
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form
)

router = APIRouter(
    prefix="/productos",
    tags=["Productos"]
)

MAX_IMAGE_BYTES = 5 * 1024 * 1024
IMAGE_SIGNATURES = (
    (b"\x89PNG\r\n\x1a\n", ".png"),
    (b"\xff\xd8\xff", ".jpg"),
    (b"GIF87a", ".gif"),
    (b"GIF89a", ".gif"),
)


def _detectar_extension_imagen(contenido: bytes) -> str | None:
    for firma, extension in IMAGE_SIGNATURES:
        if contenido.startswith(firma):
            return extension
    if (
        len(contenido) >= 12
        and contenido.startswith(b"RIFF")
        and contenido[8:12] == b"WEBP"
    ):
        return ".webp"
    return None


def _guardar_imagen(imagen: UploadFile) -> str:
    contenido = imagen.file.read(MAX_IMAGE_BYTES + 1)
    if len(contenido) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="La imagen no puede superar 5 MB.")
    extension = _detectar_extension_imagen(contenido)
    if extension is None:
        raise HTTPException(
            status_code=422,
            detail="Solo se permiten imágenes PNG, JPEG, GIF o WebP válidas.",
        )
    os.makedirs("uploads", exist_ok=True)
    ruta = Path("uploads") / f"{uuid4().hex}{extension}"
    with ruta.open("wb") as archivo:
        archivo.write(contenido)
    return ruta.as_posix()


@router.get("/", response_model=list[ProductoResponse])
def listar_productos(
    nombre: Optional[str] = None,
    id_categoria: Optional[int] = None,
    activo: Optional[bool] = None,
    stock_minimo: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):

    return ProductoService.listar(
        db,
        nombre,
        id_categoria,
        activo,
        stock_minimo,
        skip,
        limit
    )

@router.get("/{id_producto}", response_model=ProductoResponse)
def obtener_producto(
    id_producto: int,
    usuario=Depends(
        requiere_roles("administrador", "cocina")
    ),
    db: Session = Depends(get_db)
):
    return ProductoService.obtener(db, id_producto)


@router.post("/", response_model=ProductoResponse)
def crear_producto(
    nombre: str = Form(...),
    descripcion: str = Form(...),
    precio: float = Form(...),
    stock: int = Form(...),
    activo: bool = Form(...),
    id_categoria: int = Form(...),
    imagen: UploadFile | None = File(None),
    usuario=Depends(
        requiere_roles("administrador", "cocina")
    ),
    db: Session = Depends(get_db)
):

    ruta = None
    if imagen and imagen.filename:
        ruta = _guardar_imagen(imagen)

    datos = ProductoCreate(
        nombre=nombre,
        descripcion=descripcion,
        precio=precio,
        stock=stock,
        imagen=ruta,
        activo=activo,
        id_categoria=id_categoria
    )

    return ProductoService.crear(
        db,
        datos
    )


@router.delete("/{id_producto}")
def eliminar_producto(
    id_producto: int,
    usuario=Depends(
        requiere_roles("administrador", "cocina")
    ),
    db: Session = Depends(get_db)
):

    ProductoService.eliminar(db, id_producto)

    return {
        "mensaje":"Producto eliminado"
    }

@router.put("/{id_producto}", response_model=ProductoResponse)
def actualizar_producto(

    id_producto: int,

    nombre: str = Form(...),
    descripcion: str = Form(...),
    precio: float = Form(...),
    stock: int = Form(...),
    activo: bool = Form(...),
    id_categoria: int = Form(...),

    imagen: UploadFile | None = File(None),

    usuario=Depends(requiere_roles("administrador", "cocina")),

    db: Session = Depends(get_db)

):

    producto = ProductoService.obtener(
        db,
        id_producto
    )

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado."
        )

    # Conservar la imagen actual
    ruta = producto.imagen

    # Si el usuario seleccionó otra imagen, reemplazarla
    if imagen and imagen.filename != "":
        ruta = _guardar_imagen(imagen)

    datos = ProductoUpdate(

        nombre=nombre,
        descripcion=descripcion,
        precio=precio,
        stock=stock,
        imagen=ruta,
        activo=activo,
        id_categoria=id_categoria

    )

    return ProductoService.actualizar(
        db,
        id_producto,
        datos
    )
