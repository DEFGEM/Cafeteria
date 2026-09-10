from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.producto import Producto
from app.models.categoria import Categoria

from fastapi import HTTPException

from sqlalchemy import func


class CategoriaService:

    @staticmethod
    def listar(db: Session):

        categorias = (
            db.query(
                Categoria.id_categoria,
                Categoria.nombre,
                Categoria.descripcion,
                func.count(Producto.id_producto).label("total_productos")
            )
            .outerjoin(
                Producto,
                Producto.id_categoria == Categoria.id_categoria
            )
            .group_by(
                Categoria.id_categoria,
                Categoria.nombre,
                Categoria.descripcion
            )
            .all()
        )

        return categorias

    @staticmethod
    def obtener(db: Session, id_categoria: int):
        categoria = (
            db.query(Categoria)
            .filter(Categoria.id_categoria == id_categoria)
            .first()
        )
        if not categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada.")
        categoria.total_productos = (
            db.query(Producto)
            .filter(Producto.id_categoria == id_categoria)
            .count()
        )
        return categoria

    @staticmethod
    def crear(db: Session, datos):

        existe = (
            db.query(Categoria)
            .filter(Categoria.nombre == datos.nombre)
            .first()
        )

        if existe:
            raise HTTPException(
                status_code=400,
                detail="Ya existe una categoría con ese nombre."
            )

        categoria = Categoria(
            nombre=datos.nombre,
            descripcion=datos.descripcion
        )

        db.add(categoria)
        db.commit()
        db.refresh(categoria)

        categoria.total_productos = 0

        return categoria
    
    @staticmethod
    def actualizar(
        db: Session,
        id_categoria: int,
        datos
    ):

        categoria = (
            db.query(Categoria)
            .filter(
                Categoria.id_categoria == id_categoria
            )
            .first()
        )

        if not categoria:
            raise HTTPException(
                status_code=404,
                detail="Categoría no encontrada."
            )

        categoria.nombre = datos.nombre
        categoria.descripcion = datos.descripcion

        db.commit()
        db.refresh(categoria)

        categoria.total_productos = (
            db.query(Producto)
            .filter(Producto.id_categoria == id_categoria)
            .count()
        )

        return categoria
    

    @staticmethod
    def eliminar(db: Session, id_categoria: int):

        categoria = (
            db.query(Categoria)
            .filter(Categoria.id_categoria == id_categoria)
            .first()
        )

        if not categoria:
            raise HTTPException(
                status_code=404,
                detail="Categoría no encontrada."
            )

        productos = (
            db.query(Producto)
            .filter(
                Producto.id_categoria == id_categoria
            )
            .count()
        )

        if productos > 0:
            raise HTTPException(
                status_code=400,
                detail="No se puede eliminar la categoría porque tiene productos asociados."
            )

        db.delete(categoria)
        db.commit()

        return {
            "mensaje": "Categoría eliminada correctamente."
        }
