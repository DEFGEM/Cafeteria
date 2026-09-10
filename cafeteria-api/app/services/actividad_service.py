from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.evento_auditoria import EventoAuditoria


class ActividadService:
    """Registra auditoría dentro de la transacción del caso de uso llamador."""

    @staticmethod
    def registrar(
        db: Session,
        *,
        modulo: str,
        accion: str,
        descripcion: str,
        id_usuario: int | None = None,
        entidad: str | None = None,
        id_entidad: int | str | None = None,
        severidad: str = "info",
        datos: dict[str, Any] | list[Any] | None = None,
    ) -> EventoAuditoria:
        evento = EventoAuditoria(
            modulo=modulo,
            accion=accion,
            entidad=entidad,
            id_entidad=str(id_entidad) if id_entidad is not None else None,
            descripcion=descripcion,
            severidad=severidad,
            datos=datos,
            id_usuario=id_usuario,
        )
        db.add(evento)
        return evento

    @staticmethod
    def listar(
        db: Session,
        *,
        modulo: str | None = None,
        accion: str | None = None,
        id_usuario: int | None = None,
        fecha_inicio: datetime | None = None,
        fecha_fin: datetime | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[EventoAuditoria]:
        consulta = db.query(EventoAuditoria)
        if modulo:
            consulta = consulta.filter(EventoAuditoria.modulo == modulo)
        if accion:
            consulta = consulta.filter(EventoAuditoria.accion == accion)
        if id_usuario is not None:
            consulta = consulta.filter(EventoAuditoria.id_usuario == id_usuario)
        if fecha_inicio:
            consulta = consulta.filter(EventoAuditoria.creado_en >= fecha_inicio)
        if fecha_fin:
            consulta = consulta.filter(EventoAuditoria.creado_en <= fecha_fin)
        return (
            consulta.order_by(EventoAuditoria.creado_en.desc(), EventoAuditoria.id_evento.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
