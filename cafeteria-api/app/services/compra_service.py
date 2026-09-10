from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.compra import Compra
from app.models.detalle_compra import DetalleCompra
from app.models.insumo import Insumo
from app.schemas.compra import EstadoCompra
from app.schemas.insumo import TipoMovimiento
from app.services.actividad_service import ActividadService
from app.services.insumo_service import InsumoService


class CompraService:
    @staticmethod
    def listar(
        db: Session,
        *,
        estado: str | None = None,
        proveedor: str | None = None,
        fecha_inicio: datetime | None = None,
        fecha_fin: datetime | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Compra]:
        consulta = db.query(Compra).options(
            joinedload(Compra.detalles).joinedload(DetalleCompra.insumo)
        )
        if estado:
            consulta = consulta.filter(Compra.estado == estado)
        if proveedor:
            consulta = consulta.filter(Compra.proveedor.ilike(f"%{proveedor.strip()}%"))
        if fecha_inicio:
            consulta = consulta.filter(Compra.fecha >= fecha_inicio)
        if fecha_fin:
            consulta = consulta.filter(Compra.fecha <= fecha_fin)
        return consulta.order_by(Compra.fecha.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def obtener(db: Session, id_compra: int, *, bloquear: bool = False) -> Compra:
        consulta = db.query(Compra).filter(Compra.id_compra == id_compra)
        if bloquear:
            consulta = consulta.with_for_update()
        compra = consulta.first()
        if not compra:
            raise HTTPException(status_code=404, detail="Compra no encontrada.")
        return compra

    @staticmethod
    def crear(db: Session, datos, id_usuario: int) -> Compra:
        if datos.folio and db.query(Compra.id_compra).filter(Compra.folio == datos.folio).first():
            raise HTTPException(status_code=409, detail="El folio de compra ya existe.")
        try:
            compra = Compra(
                proveedor=datos.proveedor,
                folio=datos.folio,
                estado=EstadoCompra.PENDIENTE.value,
                observaciones=datos.observaciones,
                id_usuario=id_usuario,
            )
            if datos.fecha is not None:
                compra.fecha = datos.fecha
            db.add(compra)
            db.flush()
            CompraService._reemplazar_detalles(db, compra, datos.detalles)
            if datos.estado == EstadoCompra.RECIBIDA:
                CompraService._recibir(db, compra, id_usuario)
            elif datos.estado == EstadoCompra.CANCELADA:
                compra.estado = EstadoCompra.CANCELADA.value
            ActividadService.registrar(
                db,
                modulo="Compras",
                accion="compra.creada",
                entidad="Compra",
                id_entidad=compra.id_compra,
                descripcion=f"Se registró una compra de {compra.proveedor}.",
                id_usuario=id_usuario,
                datos={"estado": compra.estado, "total": str(compra.total)},
            )
            db.commit()
            return CompraService.obtener(db, compra.id_compra)
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=409, detail="El folio de compra ya existe.") from exc
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def actualizar(db: Session, id_compra: int, datos, id_usuario: int) -> Compra:
        compra = CompraService.obtener(db, id_compra, bloquear=True)
        if compra.estado == EstadoCompra.RECIBIDA.value:
            raise HTTPException(
                status_code=409,
                detail="Una compra recibida no puede modificarse; sus movimientos ya fueron aplicados.",
            )
        if compra.estado == EstadoCompra.CANCELADA.value:
            raise HTTPException(status_code=409, detail="Una compra cancelada no puede modificarse.")

        cambios = datos.model_dump(exclude_unset=True, exclude={"detalles", "estado"})
        try:
            for campo, valor in cambios.items():
                setattr(compra, campo, valor)
            if datos.detalles is not None:
                CompraService._reemplazar_detalles(db, compra, datos.detalles)
            if datos.estado == EstadoCompra.RECIBIDA:
                CompraService._recibir(db, compra, id_usuario)
            elif datos.estado == EstadoCompra.CANCELADA:
                compra.estado = EstadoCompra.CANCELADA.value
            ActividadService.registrar(
                db,
                modulo="Compras",
                accion="compra.actualizada",
                entidad="Compra",
                id_entidad=id_compra,
                descripcion=f"Se actualizó la compra #{id_compra}.",
                id_usuario=id_usuario,
                datos={"estado": compra.estado, "total": str(compra.total)},
            )
            db.commit()
            return CompraService.obtener(db, id_compra)
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=409, detail="El folio de compra ya existe.") from exc
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def recibir(db: Session, id_compra: int, id_usuario: int) -> Compra:
        compra = CompraService.obtener(db, id_compra, bloquear=True)
        try:
            CompraService._recibir(db, compra, id_usuario)
            ActividadService.registrar(
                db,
                modulo="Compras",
                accion="compra.recibida",
                entidad="Compra",
                id_entidad=id_compra,
                descripcion=f"Se recibió la compra #{id_compra} y se actualizó el inventario.",
                id_usuario=id_usuario,
                datos={"total": str(compra.total)},
            )
            db.commit()
            return CompraService.obtener(db, id_compra)
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def _reemplazar_detalles(db: Session, compra: Compra, detalles) -> None:
        ids = [detalle.id_insumo for detalle in detalles]
        insumos = (
            db.query(Insumo)
            .filter(Insumo.id_insumo.in_(ids), Insumo.activo.is_(True))
            .all()
        )
        mapa = {insumo.id_insumo: insumo for insumo in insumos}
        faltantes = sorted(set(ids) - set(mapa))
        if faltantes:
            raise HTTPException(
                status_code=422,
                detail=f"Insumos inexistentes o inactivos: {faltantes}.",
            )

        compra.detalles.clear()
        total = Decimal("0")
        for datos_detalle in detalles:
            subtotal = (datos_detalle.cantidad * datos_detalle.costo_unitario).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP,
            )
            total += subtotal
            compra.detalles.append(
                DetalleCompra(
                    id_insumo=datos_detalle.id_insumo,
                    cantidad=datos_detalle.cantidad,
                    costo_unitario=datos_detalle.costo_unitario,
                    subtotal=subtotal,
                )
            )
        compra.total = total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        db.flush()

    @staticmethod
    def _recibir(db: Session, compra: Compra, id_usuario: int) -> None:
        if compra.estado == EstadoCompra.RECIBIDA.value:
            raise HTTPException(status_code=409, detail="La compra ya fue recibida.")
        if compra.estado == EstadoCompra.CANCELADA.value:
            raise HTTPException(status_code=409, detail="Una compra cancelada no puede recibirse.")
        if not compra.detalles:
            raise HTTPException(status_code=409, detail="La compra no contiene insumos.")

        ids = [detalle.id_insumo for detalle in compra.detalles]
        insumos = (
            db.query(Insumo)
            .filter(Insumo.id_insumo.in_(ids), Insumo.activo.is_(True))
            .with_for_update()
            .all()
        )
        mapa = {insumo.id_insumo: insumo for insumo in insumos}
        faltantes = sorted(set(ids) - set(mapa))
        if faltantes:
            raise HTTPException(
                status_code=409,
                detail=f"No se puede recibir: insumos inexistentes o inactivos {faltantes}.",
            )

        for detalle in compra.detalles:
            InsumoService.aplicar_movimiento(
                db,
                insumo=mapa[detalle.id_insumo],
                tipo=TipoMovimiento.ENTRADA,
                cantidad=detalle.cantidad,
                motivo=f"Recepción de compra #{compra.id_compra}",
                referencia=compra.folio or f"compra:{compra.id_compra}",
                id_usuario=id_usuario,
                id_compra=compra.id_compra,
            )
        compra.estado = EstadoCompra.RECIBIDA.value
        compra.recibido_en = datetime.now(timezone.utc)
        db.flush()
