from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.insumo import Insumo
from app.models.movimiento_inventario import MovimientoInventario
from app.models.notificacion import Notificacion
from app.schemas.insumo import TipoMovimiento
from app.services.actividad_service import ActividadService


class InsumoService:
    @staticmethod
    def listar(
        db: Session,
        *,
        nombre: str | None = None,
        categoria: str | None = None,
        activo: bool | None = True,
        stock_bajo: bool | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Insumo]:
        consulta = db.query(Insumo)
        if nombre:
            consulta = consulta.filter(Insumo.nombre.ilike(f"%{nombre.strip()}%"))
        if categoria:
            consulta = consulta.filter(Insumo.categoria == categoria.strip())
        if activo is not None:
            consulta = consulta.filter(Insumo.activo == activo)
        if stock_bajo is True:
            consulta = consulta.filter(Insumo.stock_actual <= Insumo.stock_minimo)
        elif stock_bajo is False:
            consulta = consulta.filter(Insumo.stock_actual > Insumo.stock_minimo)
        return consulta.order_by(Insumo.nombre).offset(skip).limit(limit).all()

    @staticmethod
    def obtener(db: Session, id_insumo: int, *, bloquear: bool = False) -> Insumo:
        consulta = db.query(Insumo).filter(Insumo.id_insumo == id_insumo)
        if bloquear:
            consulta = consulta.with_for_update()
        insumo = consulta.first()
        if not insumo:
            raise HTTPException(status_code=404, detail="Insumo no encontrado.")
        return insumo

    @staticmethod
    def crear(db: Session, datos, id_usuario: int) -> Insumo:
        repetido = (
            db.query(Insumo.id_insumo)
            .filter(func.lower(Insumo.nombre) == datos.nombre.lower())
            .first()
        )
        if repetido:
            raise HTTPException(status_code=409, detail="Ya existe un insumo con ese nombre.")

        insumo = Insumo(
            nombre=datos.nombre,
            descripcion=datos.descripcion,
            categoria=datos.categoria,
            unidad_medida=datos.unidad_medida,
            stock_actual=datos.stock_inicial,
            stock_minimo=datos.stock_minimo,
            activo=datos.activo,
        )
        try:
            db.add(insumo)
            db.flush()
            if datos.stock_inicial > 0:
                db.add(
                    MovimientoInventario(
                        tipo=TipoMovimiento.ENTRADA.value,
                        cantidad=datos.stock_inicial,
                        stock_anterior=Decimal("0"),
                        stock_posterior=datos.stock_inicial,
                        motivo="Stock inicial",
                        referencia="alta_insumo",
                        id_insumo=insumo.id_insumo,
                        id_usuario=id_usuario,
                    )
                )
            ActividadService.registrar(
                db,
                modulo="Inventario",
                accion="insumo.creado",
                entidad="Insumo",
                id_entidad=insumo.id_insumo,
                descripcion=f"Se creó el insumo {insumo.nombre}.",
                id_usuario=id_usuario,
                datos={"stock_inicial": str(datos.stock_inicial)},
            )
            db.commit()
            db.refresh(insumo)
            return insumo
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=409, detail="El insumo ya existe.") from exc
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def actualizar(db: Session, id_insumo: int, datos, id_usuario: int) -> Insumo:
        insumo = InsumoService.obtener(db, id_insumo, bloquear=True)
        cambios = datos.model_dump(exclude_unset=True)
        if "nombre" in cambios:
            repetido = (
                db.query(Insumo.id_insumo)
                .filter(
                    func.lower(Insumo.nombre) == cambios["nombre"].lower(),
                    Insumo.id_insumo != id_insumo,
                )
                .first()
            )
            if repetido:
                raise HTTPException(
                    status_code=409,
                    detail="Ya existe un insumo con ese nombre.",
                )
        try:
            for campo, valor in cambios.items():
                setattr(insumo, campo, valor)
            ActividadService.registrar(
                db,
                modulo="Inventario",
                accion="insumo.actualizado",
                entidad="Insumo",
                id_entidad=id_insumo,
                descripcion=f"Se actualizó el insumo {insumo.nombre}.",
                id_usuario=id_usuario,
                datos={"campos": sorted(cambios)},
            )
            db.commit()
            db.refresh(insumo)
            return insumo
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=409, detail="El nombre del insumo ya está en uso.") from exc
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def desactivar(db: Session, id_insumo: int, id_usuario: int) -> Insumo:
        insumo = InsumoService.obtener(db, id_insumo, bloquear=True)
        if not insumo.activo:
            return insumo
        try:
            insumo.activo = False
            ActividadService.registrar(
                db,
                modulo="Inventario",
                accion="insumo.desactivado",
                entidad="Insumo",
                id_entidad=id_insumo,
                descripcion=f"Se desactivó el insumo {insumo.nombre}.",
                id_usuario=id_usuario,
                severidad="warning",
            )
            db.commit()
            db.refresh(insumo)
            return insumo
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def registrar_movimiento(
        db: Session,
        id_insumo: int,
        datos,
        id_usuario: int,
    ) -> MovimientoInventario:
        insumo = InsumoService.obtener(db, id_insumo, bloquear=True)
        if not insumo.activo:
            raise HTTPException(status_code=409, detail="El insumo está desactivado.")
        try:
            movimiento = InsumoService.aplicar_movimiento(
                db,
                insumo=insumo,
                tipo=datos.tipo,
                cantidad=datos.cantidad,
                motivo=datos.motivo,
                referencia=datos.referencia,
                id_usuario=id_usuario,
            )
            ActividadService.registrar(
                db,
                modulo="Inventario",
                accion="inventario.movimiento",
                entidad="Insumo",
                id_entidad=id_insumo,
                descripcion=(
                    f"{movimiento.tipo} de {movimiento.cantidad} "
                    f"{insumo.unidad_medida} en {insumo.nombre}."
                ),
                id_usuario=id_usuario,
                datos={
                    "stock_anterior": str(movimiento.stock_anterior),
                    "stock_posterior": str(movimiento.stock_posterior),
                },
            )
            if (
                movimiento.stock_posterior <= Decimal(insumo.stock_minimo)
                and movimiento.stock_anterior > Decimal(insumo.stock_minimo)
            ):
                db.add(
                    Notificacion(
                        titulo="Stock bajo",
                        mensaje=(
                            f"{insumo.nombre} quedó en "
                            f"{movimiento.stock_posterior} "
                            f"{insumo.unidad_medida}; el mínimo es "
                            f"{insumo.stock_minimo}."
                        ),
                        tipo="inventario",
                        severidad="warning",
                        rol_destino="caja",
                        id_usuario_creador=id_usuario,
                    )
                )
            db.commit()
            db.refresh(movimiento)
            return movimiento
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def aplicar_movimiento(
        db: Session,
        *,
        insumo: Insumo,
        tipo: TipoMovimiento | str,
        cantidad: Decimal,
        motivo: str,
        id_usuario: int | None,
        referencia: str | None = None,
        id_compra: int | None = None,
    ) -> MovimientoInventario:
        tipo_valor = tipo.value if isinstance(tipo, TipoMovimiento) else tipo
        anterior = Decimal(insumo.stock_actual)
        cantidad = Decimal(cantidad)
        if tipo_valor == TipoMovimiento.ENTRADA.value:
            posterior = anterior + cantidad
        elif tipo_valor == TipoMovimiento.SALIDA.value:
            posterior = anterior - cantidad
            if posterior < 0:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Stock insuficiente de {insumo.nombre}: "
                        f"disponible {anterior} {insumo.unidad_medida}."
                    ),
                )
        elif tipo_valor == TipoMovimiento.AJUSTE.value:
            posterior = cantidad
            if posterior == anterior:
                raise HTTPException(
                    status_code=409,
                    detail="El ajuste no modifica el stock actual.",
                )
        else:
            raise HTTPException(status_code=422, detail="Tipo de movimiento inválido.")

        movimiento = MovimientoInventario(
            tipo=tipo_valor,
            cantidad=cantidad,
            stock_anterior=anterior,
            stock_posterior=posterior,
            motivo=motivo,
            referencia=referencia,
            id_insumo=insumo.id_insumo,
            id_usuario=id_usuario,
            id_compra=id_compra,
        )
        insumo.stock_actual = posterior
        db.add(movimiento)
        db.flush()
        return movimiento

    @staticmethod
    def listar_movimientos(
        db: Session,
        id_insumo: int,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[MovimientoInventario]:
        InsumoService.obtener(db, id_insumo)
        return (
            db.query(MovimientoInventario)
            .filter(MovimientoInventario.id_insumo == id_insumo)
            .order_by(
                MovimientoInventario.creado_en.desc(),
                MovimientoInventario.id_movimiento.desc(),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
