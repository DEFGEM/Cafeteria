from decimal import Decimal
import os
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.auth.security import hash_password
from app.database import SessionLocal
from app.models import Categoria, Mesa, Producto, Rol, Usuario


DEMO_USERS = [
    {
        "nombre_completo": "Usuario Mesero",
        "email": "mesero@cafeteria.local",
        "password_env": "SEED_MESERO_PASSWORD",
        "rol": "mesero",
    },
    {
        "nombre_completo": "Usuario Cocina",
        "email": "cocina@cafeteria.local",
        "password_env": "SEED_COCINA_PASSWORD",
        "rol": "cocina",
    },
    {
        "nombre_completo": "Usuario Caja",
        "email": "caja@cafeteria.local",
        "password_env": "SEED_CAJA_PASSWORD",
        "rol": "caja",
    },
    {
        "nombre_completo": "Usuario Administrador",
        "email": "admin@cafeteria.local",
        "password_env": "SEED_ADMIN_PASSWORD",
        "rol": "administrador",
    },
]


def get_or_create_role(db, nombre, descripcion):
    rol = db.query(Rol).filter(Rol.nombre == nombre).first()

    if rol:
        rol.descripcion = descripcion
        return rol

    rol = Rol(nombre=nombre, descripcion=descripcion)
    db.add(rol)
    db.flush()
    return rol


def get_or_create_category(db):
    categoria = (
        db.query(Categoria)
        .filter(Categoria.nombre == "Bebidas")
        .first()
    )

    if categoria:
        categoria.descripcion = "Bebidas calientes y frias"
        return categoria

    categoria = Categoria(
        nombre="Bebidas",
        descripcion="Bebidas calientes y frias"
    )
    db.add(categoria)
    db.flush()
    return categoria


def get_or_create_table(db):
    mesa = db.query(Mesa).filter(Mesa.numero == 1).first()

    if mesa:
        mesa.capacidad = 4
        mesa.estado = "Libre"
        return mesa

    mesa = Mesa(numero=1, capacidad=4, estado="Libre")
    db.add(mesa)
    db.flush()
    return mesa


def get_or_create_product(db, categoria):
    producto = (
        db.query(Producto)
        .filter(Producto.nombre == "Cafe Americano")
        .first()
    )

    if producto:
        producto.descripcion = "Cafe americano de prueba"
        producto.precio = Decimal("35.00")
        producto.stock = 50
        producto.activo = True
        producto.id_categoria = categoria.id_categoria
        return producto

    producto = Producto(
        nombre="Cafe Americano",
        descripcion="Cafe americano de prueba",
        precio=Decimal("35.00"),
        stock=50,
        imagen=None,
        activo=True,
        id_categoria=categoria.id_categoria
    )
    db.add(producto)
    db.flush()
    return producto


def get_or_create_users(db, roles_by_name):
    for demo_user in DEMO_USERS:
        password = os.getenv(demo_user["password_env"])
        if not password:
            raise RuntimeError(
                f"Falta la variable {demo_user['password_env']} para crear usuarios."
            )
        usuario = (
            db.query(Usuario)
            .filter(Usuario.email == demo_user["email"])
            .first()
        )
        rol = roles_by_name[demo_user["rol"]]

        if usuario:
            usuario.nombre_completo = demo_user["nombre_completo"]
            usuario.password_hash = hash_password(password)
            usuario.activo = True
            usuario.id_rol = rol.id_rol
            continue

        usuario = Usuario(
            nombre_completo=demo_user["nombre_completo"],
            email=demo_user["email"],
            password_hash=hash_password(password),
            activo=True,
            id_rol=rol.id_rol
        )
        db.add(usuario)


def main():
    db = SessionLocal()
    try:
        roles_by_name = {
            "administrador": get_or_create_role(
                db,
                "administrador",
                "Gestion general del sistema"
            ),
            "mesero": get_or_create_role(
                db,
                "mesero",
                "Levantamiento y seguimiento de pedidos"
            ),
            "cocina": get_or_create_role(
                db,
                "cocina",
                "Preparacion y actualizacion de pedidos"
            ),
            "caja": get_or_create_role(
                db,
                "caja",
                "Cobro de pedidos y control de caja"
            ),
        }

        categoria = get_or_create_category(db)
        mesa = get_or_create_table(db)
        producto = get_or_create_product(db, categoria)
        get_or_create_users(db, roles_by_name)

        db.commit()

        print("Datos demo listos para Postman.")
        print(f"id_mesa={mesa.id_mesa}")
        print(f"id_producto={producto.id_producto}")
        print("Usuarios creados con contraseñas proporcionadas mediante SEED_*.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
