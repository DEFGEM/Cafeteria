# Cafetería unificada

Proyecto compuesto por una API FastAPI/PostgreSQL, un panel web Flask y una aplicación Expo. La API es la fuente de verdad para pedidos, Cocina, Caja, inventario, compras, gastos, promociones, notificaciones y preferencias.

## 1. API

```bash
cd cafeteria-api
# Solo crea .env si todavía no existe; no reemplaza tus credenciales.
cp --no-clobber .env.example .env
.venv/bin/pip install -r requirements.txt
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Configura `DATABASE_URL`, `SECRET_KEY` y `CORS_ORIGINS` en `.env`. La documentación interactiva queda en `http://127.0.0.1:8000/docs` y el diagnóstico en `http://127.0.0.1:8000/health`.

Para crear los usuarios base, define `SEED_MESERO_PASSWORD`, `SEED_COCINA_PASSWORD`, `SEED_CAJA_PASSWORD` y `SEED_ADMIN_PASSWORD`, y luego ejecuta:

```bash
.venv/bin/python scripts/seed_mobile_demo.py
```

Para poblar todos los dominios con datos demo (categorías, productos, mesas, insumos, compras, gastos, promociones, notificaciones, preferencias y auditoría):

```bash
.venv/bin/python scripts/seed_demo_completo.py
```

## 2. Aplicación web

```bash
cd cafeteria-web
# Solo crea .env si todavía no existe; no reemplaza tus credenciales.
cp --no-clobber .env.example .env
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python app.py
```

El panel queda en `http://127.0.0.1:5000`. Requiere la API corriendo en el
`API_URL` configurado (por defecto `http://127.0.0.1:8000`). Las credenciales
de acceso son las mismas de la sección Credenciales.

## 3. Aplicación móvil

```bash
cd cafeteria-movil
# Solo crea .env.local si todavía no existe.
cp --no-clobber .env.example .env.local
npm install
npx expo start
```

En un teléfono físico, `EXPO_PUBLIC_API_URL` debe usar la IP Wi-Fi del equipo que ejecuta FastAPI, por ejemplo `http://192.168.0.17:8000`. El teléfono y el equipo deben estar en la misma red.

## 4. Credenciales

Credenciales de acceso web y móvil (misma API):

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Mesero | `mesero@cafeteria.local` | `Mesero123!` |
| Cocina | `cocina@cafeteria.local` | `Cocina123!` |
| Caja | `caja@cafeteria.local` | `Caja123!` |
| Administrador | `admin@cafeteria.local` | `Admin123!` |

La tarjeta imprimible de credenciales (entregable del Tercer Parcial) está en
[`docs/credenciales/tarjeta_credenciales.pdf`](docs/credenciales/tarjeta_credenciales.pdf)
y se regenera con
`.venv/bin/python scripts/generar_tarjeta_credenciales.py`.

## 5. Verificación

```bash
cd cafeteria-api
.venv/bin/python -m unittest discover -s tests -v
.venv/bin/alembic current

cd ../cafeteria-movil
npx expo-doctor
npx expo export --platform web
npx expo export --platform android
```

El planteamiento y estado por sets está en [docs/PLAN_INTEGRACION_MOVIL_API.md](docs/PLAN_INTEGRACION_MOVIL_API.md).
