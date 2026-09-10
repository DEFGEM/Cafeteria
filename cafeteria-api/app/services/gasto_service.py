from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.gasto import Gasto
from app.services.actividad_service import ActividadService


class GastoService:
    @staticmethod
    def listar(
        db: Session,
        *,
        categoria: str | None = None,
        fecha_inicio: datetime | None = None,
        fecha_fin: datetime | None = None,
        incluir_eliminados: bool = False,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Gasto]:
        consulta = db.query(Gasto)
        if not incluir_eliminados:
            consulta = consulta.filter(Gasto.activo.is_(True))
        if categoria:
            consulta = consulta.filter(Gasto.categoria == categoria.strip())
        if fecha_inicio:
            consulta = consulta.filter(Gasto.fecha >= fecha_inicio)
        if fecha_fin:
            consulta = consulta.filter(Gasto.fecha <= fecha_fin)
        return consulta.order_by(Gasto.fecha.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def obtener(db: Session, id_gasto: int, *, incluir_eliminado: bool = False) -> Gasto:
        consulta = db.query(Gasto).filter(Gasto.id_gasto == id_gasto)
        if not incluir_eliminado:
            consulta = consulta.filter(Gasto.activo.is_(True))
        gasto = consulta.first()
        if not gasto:
            raise HTTPException(status_code=404, detail="Gasto no encontrado.")
        return gasto

    @staticmethod
    def crear(db: Session, datos, id_usuario: int) -> Gasto:
        gasto = Gasto(
            categoria=datos.categoria,
            descripcion=datos.descripcion,
            monto=datos.monto,
            metodo_pago=datos.metodo_pago,
            comprobante=datos.comprobante,
            id_usuario=id_usuario,
        )
        if datos.fecha is not None:
            gasto.fecha = datos.fecha
        try:
            db.add(gasto)
            db.flush()
            ActividadService.registrar(
                db,
                modulo="Caja",
                accion="gasto.creado",
                entidad="Gasto",
                id_entidad=gasto.id_gasto,
                descripcion=f"Se registró el gasto: {gasto.descripcion}.",
                id_usuario=id_usuario,
                datos={"categoria": gasto.categoria, "monto": str(gasto.monto)},
            )
            db.commit()
            db.refresh(gasto)
            return gasto
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def actualizar(db: Session, id_gasto: int, datos, id_usuario: int) -> Gasto:
        gasto = GastoService.obtener(db, id_gasto)
        cambios = datos.model_dump(exclude_unset=True)
        try:
            for campo, valor in cambios.items():
                setattr(gasto, campo, valor)
            ActividadService.registrar(
                db,
                modulo="Caja",
                accion="gasto.actualizado",
                entidad="Gasto",
                id_entidad=id_gasto,
                descripcion=f"Se actualizó el gasto #{id_gasto}.",
                id_usuario=id_usuario,
                datos={"campos": sorted(cambios)},
            )
            db.commit()
            db.refresh(gasto)
            return gasto
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def eliminar(db: Session, id_gasto: int, id_usuario: int) -> Gasto:
        gasto = GastoService.obtener(db, id_gasto)
        try:
            gasto.activo = False
            gasto.eliminado_en = datetime.now(timezone.utc)
            ActividadService.registrar(
                db,
                modulo="Caja",
                accion="gasto.eliminado",
                entidad="Gasto",
                id_entidad=id_gasto,
                descripcion=f"Se eliminó lógicamente el gasto #{id_gasto}.",
                id_usuario=id_usuario,
                severidad="warning",
                datos={"monto": str(gasto.monto)},
            )
            db.commit()
            db.refresh(gasto)
            return gasto
        except Exception:
            db.rollback()
            raise
