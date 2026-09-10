from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.producto import Producto
from app.models.promocion import Promocion
from app.schemas.promocion import TipoPromocion
from app.services.actividad_service import ActividadService


class PromocionService:
    @staticmethod
    def listar(
        db: Session,
        *,
        activo: bool | None = None,
        id_producto: int | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Promocion]:
        consulta = db.query(Promocion).options(joinedload(Promocion.producto))
        if activo is not None:
            consulta = consulta.filter(Promocion.activo == activo)
        if id_producto is not None:
            consulta = consulta.filter(Promocion.id_producto == id_producto)
        return (
            consulta.order_by(Promocion.fecha_inicio.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def listar_activas(
        db: Session,
        *,
        id_producto: int | None = None,
        momento: datetime | None = None,
    ) -> list[Promocion]:
        ahora = momento or datetime.now(timezone.utc)
        consulta = (
            db.query(Promocion)
            .options(joinedload(Promocion.producto))
            .filter(
                Promocion.activo.is_(True),
                Promocion.fecha_inicio <= ahora,
                Promocion.fecha_fin >= ahora,
            )
        )
        if id_producto is not None:
            consulta = consulta.filter(
                (Promocion.id_producto == id_producto) | (Promocion.id_producto.is_(None))
            )
        return consulta.order_by(Promocion.fecha_fin).all()

    @staticmethod
    def obtener(db: Session, id_promocion: int) -> Promocion:
        promocion = (
            db.query(Promocion)
            .options(joinedload(Promocion.producto))
            .filter(Promocion.id_promocion == id_promocion)
            .first()
        )
        if not promocion:
            raise HTTPException(status_code=404, detail="Promoción no encontrada.")
        return promocion

    @staticmethod
    def crear(db: Session, datos, id_usuario: int) -> Promocion:
        PromocionService._validar_producto(db, datos.id_producto)
        PromocionService._validar_valor(datos.tipo, datos.valor)
        promocion = Promocion(
            **datos.model_dump(),
            id_usuario=id_usuario,
        )
        promocion.tipo = datos.tipo.value
        try:
            db.add(promocion)
            db.flush()
            ActividadService.registrar(
                db,
                modulo="Marketing",
                accion="promocion.creada",
                entidad="Promocion",
                id_entidad=promocion.id_promocion,
                descripcion=f"Se creó la promoción {promocion.nombre}.",
                id_usuario=id_usuario,
            )
            db.commit()
            return PromocionService.obtener(db, promocion.id_promocion)
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def actualizar(db: Session, id_promocion: int, datos, id_usuario: int) -> Promocion:
        promocion = PromocionService.obtener(db, id_promocion)
        cambios = datos.model_dump(exclude_unset=True)
        if "id_producto" in cambios:
            PromocionService._validar_producto(db, cambios["id_producto"])

        inicio = cambios.get("fecha_inicio", promocion.fecha_inicio)
        fin = cambios.get("fecha_fin", promocion.fecha_fin)
        if fin <= inicio:
            raise HTTPException(
                status_code=422,
                detail="La fecha de fin debe ser posterior a la fecha de inicio.",
            )
        tipo = cambios.get("tipo", promocion.tipo)
        valor = cambios.get("valor", promocion.valor)
        PromocionService._validar_valor(tipo, valor)

        try:
            for campo, valor_campo in cambios.items():
                if campo == "tipo" and isinstance(valor_campo, TipoPromocion):
                    valor_campo = valor_campo.value
                setattr(promocion, campo, valor_campo)
            ActividadService.registrar(
                db,
                modulo="Marketing",
                accion="promocion.actualizada",
                entidad="Promocion",
                id_entidad=id_promocion,
                descripcion=f"Se actualizó la promoción {promocion.nombre}.",
                id_usuario=id_usuario,
                datos={"campos": sorted(cambios)},
            )
            db.commit()
            return PromocionService.obtener(db, id_promocion)
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def eliminar(db: Session, id_promocion: int, id_usuario: int) -> Promocion:
        promocion = PromocionService.obtener(db, id_promocion)
        try:
            promocion.activo = False
            ActividadService.registrar(
                db,
                modulo="Marketing",
                accion="promocion.desactivada",
                entidad="Promocion",
                id_entidad=id_promocion,
                descripcion=f"Se desactivó la promoción {promocion.nombre}.",
                id_usuario=id_usuario,
                severidad="warning",
            )
            db.commit()
            return promocion
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def calcular_precio(promocion: Promocion, precio: Decimal) -> Decimal:
        precio = Decimal(precio)
        valor = Decimal(promocion.valor)
        if promocion.tipo == TipoPromocion.PORCENTAJE.value:
            resultado = precio * (Decimal("1") - valor / Decimal("100"))
        elif promocion.tipo == TipoPromocion.MONTO.value:
            resultado = precio - valor
        else:
            resultado = valor
        return max(resultado, Decimal("0")).quantize(Decimal("0.01"))

    @staticmethod
    def _validar_producto(db: Session, id_producto: int | None) -> None:
        if id_producto is None:
            return
        if not db.query(Producto.id_producto).filter(Producto.id_producto == id_producto).first():
            raise HTTPException(status_code=422, detail="El producto indicado no existe.")

    @staticmethod
    def _validar_valor(tipo: TipoPromocion | str, valor: Decimal) -> None:
        tipo_valor = tipo.value if isinstance(tipo, TipoPromocion) else tipo
        if Decimal(valor) <= 0:
            raise HTTPException(status_code=422, detail="El valor debe ser mayor que cero.")
        if tipo_valor == TipoPromocion.PORCENTAJE.value and Decimal(valor) > 100:
            raise HTTPException(status_code=422, detail="El porcentaje no puede superar 100.")
