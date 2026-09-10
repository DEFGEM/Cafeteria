from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.producto import Producto


class ProductoService:

    @staticmethod
    def listar(
        db: Session,
        nombre: str = None,
        id_categoria: int = None,
        activo: bool = None,
        stock_minimo: int = None,
        skip: int = 0,
        limit: int = 100
        ):

        consulta = db.query(Producto)

        if nombre:
            consulta = consulta.filter(
                Producto.nombre.ilike(f"%{nombre}%")
            )

        if id_categoria:
            consulta = consulta.filter(
                Producto.id_categoria == id_categoria
            )

        if activo is not None:
            consulta = consulta.filter(
                Producto.activo == activo
            )

        if stock_minimo is not None:
            consulta = consulta.filter(
                Producto.stock >= stock_minimo
            )

        return (
            consulta
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def obtener(db: Session, id_producto: int):
        producto = (
            db.query(Producto)
            .filter(Producto.id_producto == id_producto)
            .first()
        )
        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado.")
        return producto

    @staticmethod
    def crear(db: Session, datos):

        producto = Producto(
            nombre=datos.nombre,
            descripcion=datos.descripcion,
            precio=datos.precio,
            stock=datos.stock,
            imagen=datos.imagen,
            activo=datos.activo,
            id_categoria=datos.id_categoria
        )

        db.add(producto)
        db.commit()
        db.refresh(producto)

        return producto

    @staticmethod
    def eliminar(db: Session, id_producto: int):

        producto = ProductoService.obtener(
            db,
            id_producto
        )

        producto.activo = False
        db.commit()
        db.refresh(producto)

        return producto
    
    @staticmethod
    def actualizar(
        db: Session,
        id_producto: int,
        datos
    ):

        producto = (
            db.query(Producto)
            .filter(
                Producto.id_producto == id_producto
            )
            .first()
        )

        producto.nombre = datos.nombre
        producto.descripcion = datos.descripcion
        producto.precio = datos.precio
        producto.stock = datos.stock
        producto.activo = datos.activo
        producto.id_categoria = datos.id_categoria

        # Solo cambiar la imagen si se subió una nueva
        if datos.imagen is not None:
            producto.imagen = datos.imagen

        db.commit()
        db.refresh(producto)

        return producto
