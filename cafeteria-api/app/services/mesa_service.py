from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.mesa import Mesa
from app.models.pedido import Pedido


class MesaService:

    @staticmethod
    def listar(
        db: Session,
        estado: str = None,
        capacidad: int = None,
        skip: int = 0,
        limit: int = 100
    ):

        consulta = db.query(Mesa)

        if estado:
            consulta = consulta.filter(
                Mesa.estado == estado
            )

        if capacidad:
            consulta = consulta.filter(
                Mesa.capacidad >= capacidad
            )

        return (
            consulta
            .order_by(Mesa.numero.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def obtener(db: Session, id_mesa: int):
        mesa = (
            db.query(Mesa)
            .filter(Mesa.id_mesa == id_mesa)
            .first()
        )
        if not mesa:
            raise HTTPException(status_code=404, detail="Mesa no encontrada.")
        return mesa

    @staticmethod
    def crear(db: Session, datos):

        mesa = Mesa(
            numero=datos.numero,
            capacidad=datos.capacidad,
            estado=datos.estado
        )

        existe = (

            db.query(Mesa)

            .filter(Mesa.numero == datos.numero)

            .first()

        )

        if existe:

            raise HTTPException(

                status_code=400,

                detail="Ya existe una mesa con ese número."

            )

        db.add(mesa)
        db.commit()
        db.refresh(mesa)

        return mesa

    @staticmethod
    def eliminar(db: Session, id_mesa: int):

        mesa = MesaService.obtener(db, id_mesa)

        pedidos = (
            db.query(Pedido)
            .filter(Pedido.id_mesa == id_mesa)
            .count()
        )

        if pedidos > 0:

            raise HTTPException(

                status_code=400,

                detail="No se puede eliminar una mesa que tiene pedidos registrados."

            )

        db.delete(mesa)

        db.commit()

        return mesa
    
    @staticmethod
    def actualizar(
        db: Session,
        id_mesa: int,
        datos
    ):

        mesa = (
            db.query(Mesa)
            .filter(Mesa.id_mesa == id_mesa)
            .first()
        )

        if not mesa:
            raise HTTPException(
                status_code=404,
                detail="Mesa no encontrada."
            )
        
        repetida = (

            db.query(Mesa)

            .filter(

                Mesa.numero == datos.numero,

                Mesa.id_mesa != id_mesa

            )

            .first()

        )

        if repetida:

            raise HTTPException(

                status_code=400,

                detail="Ese número de mesa ya existe."

            )

        if datos.estado == "Libre":
            pedido_activo = (
                db.query(Pedido.id_pedido)
                .filter(
                    Pedido.id_mesa == id_mesa,
                    Pedido.estado.in_(["Pendiente", "En preparación", "Listo"]),
                )
                .first()
            )
            if pedido_activo:
                raise HTTPException(
                    status_code=409,
                    detail="No se puede liberar una mesa con un pedido activo.",
                )

        mesa.numero = datos.numero
        mesa.capacidad = datos.capacidad
        mesa.estado = datos.estado

        db.commit()
        db.refresh(mesa)

        return mesa
    
    @staticmethod
    def estadisticas(db: Session):

        return {

            "total": db.query(Mesa).count(),

            "libres": db.query(Mesa)
                .filter(Mesa.estado == "Libre")
                .count(),

            "ocupadas": db.query(Mesa)
                .filter(Mesa.estado == "Ocupada")
                .count(),

            "reservadas": db.query(Mesa)
                .filter(Mesa.estado == "Reservada")
                .count()

        }
