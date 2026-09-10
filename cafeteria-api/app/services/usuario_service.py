from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.auth.security import hash_password

from app.models.usuario import Usuario

class UsuarioService:

    @staticmethod
    def listar(
        db: Session,
        nombre: str = None,
        activo: bool = None,
        id_rol: int = None,
        skip: int = 0,
        limit: int = 100
    ):

        consulta = db.query(Usuario)

        if nombre:
            consulta = consulta.filter(
                Usuario.nombre_completo.ilike(f"%{nombre}%")
            )

        if activo is not None:
            consulta = consulta.filter(
                Usuario.activo == activo
            )

        if id_rol:
            consulta = consulta.filter(
                Usuario.id_rol == id_rol
            )

        return (
            consulta
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def obtener(db: Session, id_usuario: int):
        usuario = db.query(Usuario).filter(
            Usuario.id_usuario == id_usuario
        ).first()
        if not usuario:
            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado."
            )
        return usuario

    @staticmethod
    def crear(db: Session, datos):

        usuario = Usuario(
            nombre_completo=datos.nombre_completo,
            email=datos.email,
            password_hash=hash_password(datos.password),
            id_rol=datos.id_rol
        )

        db.add(usuario)
        db.commit()
        db.refresh(usuario)

        return usuario

    @staticmethod
    def eliminar(db: Session, id_usuario: int):

        usuario = UsuarioService.obtener(db, id_usuario)

        db.delete(usuario)
        db.commit()

        return usuario

    @staticmethod
    def actualizar(
        db: Session,
        id_usuario: int,
        datos
    ):

        usuario = (
            db.query(Usuario)
            .filter(
                Usuario.id_usuario == id_usuario
            )
            .first()
        )

        if not usuario:
            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado."
            )

        usuario.nombre_completo = datos.nombre_completo
        usuario.email = datos.email
        usuario.id_rol = datos.id_rol
        usuario.activo = datos.activo

        if datos.password:
            usuario.password_hash = hash_password(datos.password)

        db.commit()
        db.refresh(usuario)

        return usuario
