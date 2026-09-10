from sqlalchemy.orm import Session

from app.models.rol import Rol


class RolService:

    @staticmethod
    def obtener_roles(db: Session):
        return db.query(Rol).all()

    @staticmethod
    def obtener_por_id(db: Session, id_rol: int):
        return db.query(Rol).filter(Rol.id_rol == id_rol).first()

    @staticmethod
    def crear(db: Session, nombre: str, descripcion: str):

        rol = Rol(
            nombre=nombre,
            descripcion=descripcion
        )

        db.add(rol)
        db.commit()
        db.refresh(rol)

        return rol