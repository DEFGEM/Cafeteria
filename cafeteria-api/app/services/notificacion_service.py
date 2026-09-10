from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.notificacion import Notificacion, NotificacionLectura
from app.models.usuario import Usuario
from app.services.actividad_service import ActividadService


ROLES_VALIDOS = {"administrador", "mesero", "cocina", "caja"}


class NotificacionService:
    @staticmethod
    def crear(db: Session, datos, id_usuario_creador: int) -> Notificacion:
        rol_destino = datos.rol_destino.lower().strip() if datos.rol_destino else None
        if rol_destino and rol_destino not in ROLES_VALIDOS:
            raise HTTPException(status_code=422, detail="El rol de destino no es válido.")
        if datos.id_usuario_destino is not None:
            existe = (
                db.query(Usuario.id_usuario)
                .filter(Usuario.id_usuario == datos.id_usuario_destino, Usuario.activo.is_(True))
                .first()
            )
            if not existe:
                raise HTTPException(
                    status_code=422,
                    detail="El usuario de destino no existe o está inactivo.",
                )
        if datos.expira_en is not None:
            ahora = datetime.now(timezone.utc)
            expira = datos.expira_en
            if expira.tzinfo is None:
                expira = expira.replace(tzinfo=timezone.utc)
            if expira <= ahora:
                raise HTTPException(status_code=422, detail="La expiración debe estar en el futuro.")

        notificacion = Notificacion(
            titulo=datos.titulo.strip(),
            mensaje=datos.mensaje.strip(),
            tipo=datos.tipo.strip(),
            severidad=datos.severidad.value,
            expira_en=datos.expira_en,
            id_usuario_destino=datos.id_usuario_destino,
            rol_destino=rol_destino,
            id_usuario_creador=id_usuario_creador,
        )
        try:
            db.add(notificacion)
            db.flush()
            ActividadService.registrar(
                db,
                modulo="Notificaciones",
                accion="notificacion.creada",
                entidad="Notificacion",
                id_entidad=notificacion.id_notificacion,
                descripcion=f"Se publicó la notificación {notificacion.titulo}.",
                id_usuario=id_usuario_creador,
                datos={
                    "id_usuario_destino": notificacion.id_usuario_destino,
                    "rol_destino": notificacion.rol_destino,
                },
            )
            db.commit()
            db.refresh(notificacion)
            NotificacionService._anotar_lectura(notificacion, None)
            return notificacion
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def listar_para_usuario(
        db: Session,
        *,
        id_usuario: int,
        rol: str,
        solo_no_leidas: bool = False,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Notificacion]:
        consulta = NotificacionService._consulta_visibles(db, id_usuario=id_usuario, rol=rol)
        if solo_no_leidas:
            consulta = consulta.filter(
                ~Notificacion.lecturas.any(NotificacionLectura.id_usuario == id_usuario)
            )
        notificaciones = (
            consulta.order_by(Notificacion.creado_en.desc(), Notificacion.id_notificacion.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        if not notificaciones:
            return []
        ids = [item.id_notificacion for item in notificaciones]
        lecturas = (
            db.query(NotificacionLectura)
            .filter(
                NotificacionLectura.id_usuario == id_usuario,
                NotificacionLectura.id_notificacion.in_(ids),
            )
            .all()
        )
        por_notificacion = {lectura.id_notificacion: lectura for lectura in lecturas}
        for notificacion in notificaciones:
            NotificacionService._anotar_lectura(
                notificacion,
                por_notificacion.get(notificacion.id_notificacion),
            )
        return notificaciones

    @staticmethod
    def marcar_leida(
        db: Session,
        id_notificacion: int,
        *,
        id_usuario: int,
        rol: str,
    ) -> Notificacion:
        notificacion = (
            NotificacionService._consulta_visibles(db, id_usuario=id_usuario, rol=rol)
            .filter(Notificacion.id_notificacion == id_notificacion)
            .first()
        )
        if not notificacion:
            raise HTTPException(status_code=404, detail="Notificación no encontrada.")
        lectura = (
            db.query(NotificacionLectura)
            .filter(
                NotificacionLectura.id_notificacion == id_notificacion,
                NotificacionLectura.id_usuario == id_usuario,
            )
            .first()
        )
        try:
            if lectura is None:
                lectura = NotificacionLectura(
                    id_notificacion=id_notificacion,
                    id_usuario=id_usuario,
                )
                db.add(lectura)
                db.commit()
                db.refresh(lectura)
            NotificacionService._anotar_lectura(notificacion, lectura)
            return notificacion
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def contar_no_leidas(db: Session, *, id_usuario: int, rol: str) -> int:
        return (
            NotificacionService._consulta_visibles(db, id_usuario=id_usuario, rol=rol)
            .filter(~Notificacion.lecturas.any(NotificacionLectura.id_usuario == id_usuario))
            .count()
        )

    @staticmethod
    def _consulta_visibles(db: Session, *, id_usuario: int, rol: str):
        ahora = datetime.now(timezone.utc)
        return db.query(Notificacion).filter(
            or_(Notificacion.expira_en.is_(None), Notificacion.expira_en > ahora),
            or_(
                Notificacion.id_usuario_destino == id_usuario,
                Notificacion.rol_destino == rol.lower(),
                and_(
                    Notificacion.id_usuario_destino.is_(None),
                    Notificacion.rol_destino.is_(None),
                ),
            ),
        )

    @staticmethod
    def _anotar_lectura(
        notificacion: Notificacion,
        lectura: NotificacionLectura | None,
    ) -> None:
        notificacion.leida = lectura is not None
        notificacion.leida_en = lectura.leida_en if lectura else None
