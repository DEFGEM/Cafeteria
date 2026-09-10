from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.preferencia_negocio import PreferenciaNegocio
from app.services.actividad_service import ActividadService


class PreferenciaNegocioService:
    @staticmethod
    def listar(
        db: Session,
        *,
        prefijo: str | None = None,
    ) -> list[PreferenciaNegocio]:
        consulta = db.query(PreferenciaNegocio)
        if prefijo:
            consulta = consulta.filter(PreferenciaNegocio.clave.startswith(prefijo.lower()))
        return consulta.order_by(PreferenciaNegocio.clave).all()

    @staticmethod
    def obtener(db: Session, clave: str) -> PreferenciaNegocio:
        preferencia = (
            db.query(PreferenciaNegocio)
            .filter(PreferenciaNegocio.clave == clave.lower())
            .first()
        )
        if not preferencia:
            raise HTTPException(status_code=404, detail="Preferencia de negocio no encontrada.")
        return preferencia

    @staticmethod
    def guardar(db: Session, clave: str, datos, id_usuario: int) -> PreferenciaNegocio:
        clave = PreferenciaNegocioService._normalizar_clave(clave)
        try:
            preferencia = (
                db.query(PreferenciaNegocio)
                .filter(PreferenciaNegocio.clave == clave)
                .with_for_update()
                .first()
            )
            accion = "preferencia.actualizada"
            if preferencia is None:
                accion = "preferencia.creada"
                preferencia = PreferenciaNegocio(clave=clave)
                db.add(preferencia)
            preferencia.valor = datos.valor
            preferencia.descripcion = datos.descripcion
            preferencia.id_usuario_actualizacion = id_usuario
            db.flush()
            ActividadService.registrar(
                db,
                modulo="Configuración",
                accion=accion,
                entidad="PreferenciaNegocio",
                id_entidad=preferencia.id_preferencia,
                descripcion=f"Se guardó la preferencia global {clave}.",
                id_usuario=id_usuario,
                datos={"clave": clave},
            )
            db.commit()
            db.refresh(preferencia)
            return preferencia
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def guardar_lote(db: Session, preferencias, id_usuario: int) -> list[PreferenciaNegocio]:
        if not preferencias:
            raise HTTPException(
                status_code=422,
                detail="Debes enviar al menos una preferencia.",
            )
        claves = [item.clave for item in preferencias]
        if len(claves) != len(set(claves)):
            raise HTTPException(status_code=422, detail="El lote contiene claves duplicadas.")
        try:
            existentes = (
                db.query(PreferenciaNegocio)
                .filter(PreferenciaNegocio.clave.in_(claves))
                .with_for_update()
                .all()
            )
            mapa = {item.clave: item for item in existentes}
            resultado = []
            for datos in preferencias:
                preferencia = mapa.get(datos.clave)
                if preferencia is None:
                    preferencia = PreferenciaNegocio(clave=datos.clave)
                    db.add(preferencia)
                preferencia.valor = datos.valor
                preferencia.descripcion = datos.descripcion
                preferencia.id_usuario_actualizacion = id_usuario
                resultado.append(preferencia)
            db.flush()
            ActividadService.registrar(
                db,
                modulo="Configuración",
                accion="preferencias.lote_actualizado",
                entidad="PreferenciaNegocio",
                descripcion=f"Se guardaron {len(resultado)} preferencias globales.",
                id_usuario=id_usuario,
                datos={"claves": claves},
            )
            db.commit()
            for preferencia in resultado:
                db.refresh(preferencia)
            return sorted(resultado, key=lambda item: item.clave)
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def _normalizar_clave(clave: str) -> str:
        clave = clave.strip().lower()
        if len(clave) < 2 or len(clave) > 100:
            raise HTTPException(status_code=422, detail="La clave debe tener entre 2 y 100 caracteres.")
        if not all(caracter.isalnum() or caracter in "._-" for caracter in clave):
            raise HTTPException(
                status_code=422,
                detail="La clave contiene caracteres no permitidos.",
            )
        return clave
