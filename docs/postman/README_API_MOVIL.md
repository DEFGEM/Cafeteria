# Pruebas Postman - API Movil

Este paquete cubre los endpoints principales para probar los modulos moviles:

- Mesero
- Cocina
- Caja

## Archivos

- `cafeteria-api-movil.postman_collection.json`: coleccion Postman.
- `cafeteria-api-movil.postman_environment.json`: variables del entorno.

## Requisitos previos

1. Tener corriendo el API:

```powershell
cd cafeteria-api
uvicorn app.main:app --reload
```

2. Tener datos base en PostgreSQL/Neon:

- Roles con nombres exactos: `mesero`, `cocina`, `caja`.
- Un usuario activo para cada rol.
- Al menos una mesa libre.
- Al menos un producto activo con stock disponible.

Configura `DATABASE_URL`, aplica las migraciones y define contraseñas de
desarrollo sin guardarlas en Git:

```bash
cd cafeteria-api
export SEED_MESERO_PASSWORD='Mesero123!'
export SEED_COCINA_PASSWORD='Cocina123!'
export SEED_CAJA_PASSWORD='Caja123!'
export SEED_ADMIN_PASSWORD='Admin123!'
.venv/bin/alembic upgrade head
.venv/bin/python scripts/seed_mobile_demo.py
```

El script crea o actualiza estos usuarios con las contraseñas proporcionadas:

| Rol | Email | Contraseña |
| --- | --- | --- |
| Mesero | `mesero@cafeteria.local` | `Mesero123!` |
| Cocina | `cocina@cafeteria.local` | `Cocina123!` |
| Caja | `caja@cafeteria.local` | `Caja123!` |
| Administrador | `admin@cafeteria.local` | `Admin123!` |

La tarjeta de credenciales imprimible (entregable del Tercer Parcial) está en
`docs/credenciales/tarjeta_credenciales.pdf` y se regenera con
`.venv/bin/python scripts/generar_tarjeta_credenciales.py`.

Variables demo:

| Variable | Valor |
| --- | --- |
| `id_mesa` | `3` |
| `id_producto` | `3` |

3. Importar en Postman:

- La coleccion.
- El environment.

4. Editar las variables del environment:

- `email_mesero`
- `password_mesero`
- `email_cocina`
- `password_cocina`
- `email_caja`
- `password_caja`
- `id_mesa`
- `id_producto`

## Flujo recomendado

1. Ejecutar `Auth / Login Mesero`.
2. Ejecutar `Auth / Login Cocina`.
3. Ejecutar `Auth / Login Caja`.
4. Ejecutar carpeta `Mesero` en orden:
   - Listar mesas.
   - Listar productos activos.
   - Crear pedido.
   - Agregar producto al pedido.
   - Ver detalle del pedido.
   - Ver pedido.
5. Ejecutar carpeta `Cocina` en orden:
   - Listar pedidos para cocina.
   - Ver detalle del pedido.
   - Marcar pedido en preparacion.
   - Marcar pedido listo.
6. Ejecutar carpeta `Caja` en orden:
   - Listar pedidos listos.
   - Ver detalle del pedido.
   - Cobrar pedido.

La coleccion guarda automaticamente `token_mesero`, `token_cocina`, `token_caja`,
`id_pedido` e `id_detalle` cuando las respuestas son correctas.
