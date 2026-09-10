# Plan maestro de integración: CoffeeAdmin móvil + API

## 1. Propósito

Unificar `cafeteria-movil` con `cafeteria-api` para que la aplicación Expo deje de usar datos simulados y opere sobre la misma base de datos que el panel web.

El trabajo se organiza en **sets**: conjuntos pequeños, verificables y entregables. Cada set debe terminar funcionando antes de iniciar el siguiente.

### Estado de implementación al 22 de julio de 2026

La tabla siguiente es el estado ejecutado; los checklists posteriores se conservan como trazabilidad del planteamiento original.

| Set | Estado | Resultado |
| --- | --- | --- |
| 0 | Completado | Flujo canónico y permisos alineados por rol. |
| 1 | Completado | CORS, `GET /health` y configuración por entorno. |
| 2 | Completado | Login JWT real, `/auth/me`, SecureStore y cierre automático en `401`. |
| 3 | Completado | Productos y mesas reales con adaptadores API → UI. |
| 4 | Completado | Pedido completo atómico, stock, cancelación y promociones aplicadas. |
| 5 | Completado | Cola de Cocina, transiciones, timestamps y demoras persistentes. |
| 6 | Completado | Caja, historial, métodos de pago, cambio y liberación de mesa. |
| 7 | Completado | Dashboard y perfil alimentados por datos sincronizados. |
| 8 | Completado | Insumos, compras, gastos, promociones, notificaciones, actividad y preferencias. |
| 9 | Completado para MVP | Polling cada 8 segundos; WebSocket queda como evolución opcional. |
| 10 | Completado para el flujo crítico | 21 pruebas backend, compilación Python, Expo Doctor y exportación web/Android. |
| 11 | Preparado para desarrollo local | Migraciones aplicadas y guía de arranque; HTTPS/EAS/backup corresponden al despliegue productivo. |

## 2. Estado actual

### Aplicación móvil

- Expo SDK 54, React 19.1 y React Native 0.81.5.
- Cliente HTTP central con timeout, errores normalizados y JWT automático.
- Sesión persistente segura con `expo-secure-store`.
- Pedidos, productos, mesas, inventario, compras, gastos, promociones y eventos provienen de la API.
- Polling de sincronización y navegación restringida por rol.
- Los nombres internos de roles son `waiter`, `kitchen`, `cashier` y `admin`.

### API

- FastAPI y PostgreSQL/Neon con migraciones Alembic hasta `d6c30a7ef142`.
- Autenticación OAuth2/JWT, `/auth/me` y validación de usuario activo en cada petición.
- Roles del backend: `mesero`, `cocina`, `caja` y `administrador`.
- Pedido completo transaccional, promociones aplicadas, flujo Cocina/Caja e historial.
- CORS explícito, health check y control de acceso por recurso.
- Dominios persistentes de inventario, compras, gastos, promociones, notificaciones, auditoría y preferencias.

## 3. Arquitectura objetivo

```text
┌──────────────────────────────┐
│ Expo / React Native          │
│                              │
│ Pantallas                    │
│   ↓                          │
│ Providers + hooks            │
│   ↓                          │
│ Servicios por dominio        │
│   ↓                          │
│ Cliente HTTP central         │
└──────────────┬───────────────┘
               │ HTTPS + JWT
┌──────────────▼───────────────┐
│ FastAPI                      │
│                              │
│ Routers                      │
│   ↓                          │
│ Services                     │
│   ↓                          │
│ SQLAlchemy                   │
└──────────────┬───────────────┘
               │
┌──────────────▼───────────────┐
│ PostgreSQL / Neon            │
└──────────────────────────────┘
```

### Fuente de verdad

- Datos de negocio: API y PostgreSQL.
- Token móvil: `expo-secure-store` en Android/iOS.
- Estado visual temporal: React local.
- Caché de consultas: capa de consultas móvil.
- La aplicación no debe inventar identificadores ni estados de negocio.

## 4. Flujo de negocio canónico

Se adopta inicialmente el flujo que ya implementa la API:

```text
Mesero crea pedido
        ↓
Pendiente
        ↓
Cocina inicia preparación
        ↓
En preparación
        ↓
Cocina marca listo
        ↓
Listo
        ↓
Caja cobra
        ↓
Pagado + mesa libre
```

La interfaz móvil ya aplica este flujo y la API valida las transiciones para evitar reglas distintas entre web, móvil y backend.

## 5. Convenciones generales

### Estados de pedido

| API | Móvil | Tipo visual |
| --- | --- | --- |
| `Pendiente` | Pendiente | `pending` |
| `En preparación` | En preparación | `kitchen` |
| `Listo` | Listo | `ready` |
| `Pagado` | Pagado | `paid` |
| `Cancelado` | Cancelado | `cancelled` |

### Roles

| API | Móvil |
| --- | --- |
| `mesero` | `waiter` |
| `cocina` | `kitchen` |
| `caja` | `cashier` |
| `administrador` | `admin` |

### Respuestas y errores

- Todas las solicitudes protegidas usan `Authorization: Bearer <token>`.
- Los errores de FastAPI se muestran desde `detail`.
- Un `401` elimina la sesión local y regresa al login.
- Un `403` muestra que el rol no tiene permiso, sin cerrar sesión.
- Un `409` representa conflicto de negocio, por ejemplo mesa ocupada.
- Cada pantalla debe manejar `loading`, `empty`, `error` y `success`.

---

# SET 0 — Alineación funcional y contrato

## Objetivo

Cerrar las decisiones que afectarían a todos los módulos antes de escribir integración.

## Tareas

### Producto

- [ ] Confirmar el flujo canónico `Pendiente → En preparación → Listo → Pagado`.
- [ ] Definir si se necesita un estado adicional `Entregado`.
- [ ] Definir si el cobro se realiza antes o después de entregar.
- [ ] Confirmar si inventario de productos e inventario de insumos son módulos distintos.
- [ ] Confirmar qué funciones pertenecen a cada rol.

### Backend

- [ ] Documentar estados válidos como enumeración.
- [ ] Documentar permisos por endpoint.
- [ ] Congelar el contrato inicial en OpenAPI/Postman.
- [ ] Acordar formato de fechas ISO 8601 y zona horaria.

### Móvil

- [ ] Eliminar dependencias conceptuales del flujo simulado Caja → Cocina.
- [ ] Crear adaptadores de rol y estado.
- [ ] Identificar qué tarjetas visuales no tienen todavía respaldo en la API.

## Criterios de aceptación

- Existe una tabla aprobada de estados, transiciones y permisos.
- Web, móvil y API usan el mismo vocabulario.
- Ningún set posterior depende de una decisión abierta.

---

# SET 1 — Infraestructura y conectividad

## Objetivo

Permitir que Expo se comunique con FastAPI desde navegador, emulador y teléfono físico.

## Backend

- [ ] Agregar `CORSMiddleware` con orígenes explícitos por entorno.
- [ ] Agregar `GET /health` que compruebe API y base de datos.
- [ ] Incorporar `CORS_ORIGINS` a `.env.example`.
- [ ] Ejecutar desarrollo con:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Móvil

- [ ] Crear `.env.example`:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.17:8000
```

- [ ] Ignorar `.env.local` en Git.
- [ ] Crear `src/config/environment.js`.
- [ ] Validar que `EXPO_PUBLIC_API_URL` exista al arrancar.
- [ ] Mostrar un mensaje claro cuando la API no sea accesible.

## Direcciones de desarrollo

| Entorno | URL típica |
| --- | --- |
| Teléfono físico en la misma Wi-Fi | `http://192.168.0.17:8000` |
| Android Emulator | `http://10.0.2.2:8000` |
| iOS Simulator | `http://127.0.0.1:8000` |
| Expo Web local | `http://127.0.0.1:8000` |

## Criterios de aceptación

- `GET /health` responde desde el teléfono.
- Expo Web completa correctamente una petición CORS.
- No existen secretos dentro de variables `EXPO_PUBLIC_*`.

---

# SET 2 — Cliente HTTP, sesión y autenticación

## Objetivo

Reemplazar el login simulado por autenticación real y persistente.

## Dependencias móviles

```bash
npx expo install expo-secure-store
```

Opcionalmente se incorporará una librería de consultas para caché, reintentos e invalidaciones.

## Estructura propuesta

```text
cafeteria-movil/src/
├── api/
│   ├── client.js
│   ├── errors.js
│   └── endpoints.js
├── services/
│   └── authService.js
├── storage/
│   └── sessionStorage.js
├── context/
│   └── SessionContext.js
└── adapters/
    └── roleAdapter.js
```

## Cliente HTTP

- [ ] Resolver URL base desde `process.env.EXPO_PUBLIC_API_URL`.
- [ ] Serializar cuerpos JSON y formularios.
- [ ] Agregar JWT automáticamente.
- [ ] Aplicar timeout.
- [ ] Normalizar errores de red y FastAPI.
- [ ] Limpiar la sesión en `401`.
- [ ] Evitar registrar tokens y contraseñas.

## Backend

- [ ] Mantener `POST /auth/login` con formulario OAuth2.
- [ ] Crear `GET /auth/me` con usuario autenticado.
- [ ] Evaluar `POST /auth/refresh` para sesiones de larga duración.
- [ ] Devolver identificador, nombre, email y rol de forma consistente.

## Móvil

- [ ] Convertir `SessionContext` en proveedor real.
- [ ] Exponer `session`, `isBootstrapping`, `login()` y `logout()`.
- [ ] Guardar token mediante `expo-secure-store`.
- [ ] Restaurar sesión cuando inicia la aplicación.
- [ ] Cambiar `LoginScreen` para enviar email y password a la API.
- [ ] Eliminar contraseñas demo del código de producción.
- [ ] Navegar según el rol devuelto por la API.

## Criterios de aceptación

- Un usuario real puede iniciar y cerrar sesión.
- Reiniciar la aplicación conserva la sesión válida.
- Token inválido o vencido vuelve al login.
- Cada rol entra únicamente a sus pantallas autorizadas.

---

# SET 3 — Catálogo, mesas y adaptadores visuales

## Objetivo

Eliminar productos y mesas simulados del flujo de Mesero.

## Endpoints existentes

```text
GET /mesas/?estado=Libre
GET /productos/?activo=true
GET /productos/{id_producto}
```

## Móvil

- [ ] Crear `mesaService.js` y `productoService.js`.
- [ ] Crear adaptadores API → UI.
- [ ] Cargar solo mesas libres al crear pedido.
- [ ] Conservar `id_mesa` real, no derivarlo del texto `Mesa 3`.
- [ ] Conservar `id_producto` real en cada elemento del carrito.
- [ ] Resolver imágenes relativas mediante la URL de la API.
- [ ] Mostrar productos sin stock como no disponibles.
- [ ] Implementar recarga manual y reintento.
- [ ] Eliminar arreglos duplicados de productos en `App.js` y `CustomerOrderScreen.js`.

## Modelo visual recomendado

```js
{
  id: producto.id_producto,
  name: producto.nombre,
  description: producto.descripcion,
  price: Number(producto.precio),
  stock: producto.stock,
  available: producto.activo && producto.stock > 0,
  imageUrl: producto.imagen,
  category: producto.categoria?.nombre,
  quantity: 0,
}
```

## Criterios de aceptación

- El menú móvil coincide con PostgreSQL.
- Cambiar precio, stock o disponibilidad en web se refleja al recargar el móvil.
- Solo se pueden seleccionar mesas disponibles y productos con stock.

---

# SET 4 — Pedido transaccional del Mesero

## Objetivo

Crear un pedido completo de manera atómica y mostrar sus detalles reales.

## Problema actual

El contrato requiere:

1. `POST /pedidos/`.
2. Un `POST /detalle-pedido/` por cada producto.

Si falla un producto, el pedido puede quedar parcial y el stock puede quedar inconsistente.

## Backend recomendado

Crear:

```text
POST /pedidos/completo
```

Payload:

```json
{
  "id_mesa": 3,
  "observaciones": "Sin azúcar",
  "productos": [
    {
      "id_producto": 3,
      "cantidad": 2
    }
  ]
}
```

Respuesta:

```json
{
  "id_pedido": 42,
  "estado": "Pendiente",
  "total": "70.00",
  "id_mesa": 3,
  "id_usuario": 7,
  "observaciones": "Sin azúcar",
  "detalles": []
}
```

## Backend

- [ ] Agregar `observaciones` a Pedido.
- [ ] Crear schemas para pedido completo.
- [ ] Validar mesa, productos, cantidades y stock antes de modificar datos.
- [ ] Crear pedido, detalles y decrementos de stock en una transacción.
- [ ] Hacer rollback ante cualquier error.
- [ ] Evitar pedidos sin productos.
- [ ] Agregar filtros para que Mesero vea sus pedidos.

## Móvil

- [ ] Crear `pedidoService.js`.
- [ ] Sustituir `addCustomerOrder()` local por la petición real.
- [ ] Bloquear doble toque durante el envío.
- [ ] Mostrar error de stock o mesa ocupada.
- [ ] Limpiar el carrito solo después de recibir éxito.
- [ ] Consultar pedidos reales y sus detalles.
- [ ] Agregar cancelación únicamente cuando el estado lo permita.

## Criterios de aceptación

- Pedido y detalles aparecen en PostgreSQL.
- El total lo calcula el backend.
- El stock se descuenta una sola vez.
- Una falla no deja pedido parcial.
- El pedido aparece para Cocina sin reiniciar la API.

---

# SET 5 — Operación de Cocina

## Objetivo

Conectar la cola de Cocina y sus cambios de estado.

## Endpoints existentes

```text
GET /cocina/pedidos
GET /cocina/pedidos/{id_pedido}/detalle
PUT /cocina/pedidos/{id_pedido}/preparar
PUT /cocina/pedidos/{id_pedido}/listo
```

## Backend

- [ ] Validar transiciones permitidas.
- [ ] Rechazar `Listo → En preparación`.
- [ ] Incluir mesa, observaciones y resumen de detalles en la respuesta.
- [ ] Ordenar la cola por antigüedad.
- [ ] Registrar timestamps `creado_en`, `preparacion_iniciada_en` y `listo_en`.

## Móvil

- [ ] Crear `cocinaService.js`.
- [ ] Eliminar `fallbackOrders` en producción.
- [ ] Cargar la cola real.
- [ ] Consultar detalles al abrir un pedido.
- [ ] Ejecutar acciones Preparar y Listo contra la API.
- [ ] Invalidar/refrescar la cola después de cada acción.
- [ ] Implementar actualización periódica inicial.

## Criterios de aceptación

- Cocina ve pedidos Pendientes y En preparación.
- Los cambios se reflejan para Mesero y Caja.
- No se muestran pedidos Pagados o Cancelados.
- Una transición inválida produce mensaje claro.

---

# SET 6 — Caja y pagos

## Objetivo

Cobrar pedidos listos y liberar la mesa de forma consistente.

## Endpoints existentes

```text
GET /caja/pedidos
GET /caja/pedidos/{id_pedido}/detalle
PUT /caja/pedidos/{id_pedido}/cobrar
```

## Cambios de dominio

Agregar al pedido o a una entidad Pago:

- `metodo_pago`.
- `monto_recibido` cuando aplique.
- `cambio` cuando aplique.
- `pagado_en`.
- `id_usuario_caja`.
- Referencia opcional de transferencia/tarjeta.

## Endpoint recomendado

```text
POST /caja/pedidos/{id_pedido}/cobrar
```

```json
{
  "metodo_pago": "Efectivo",
  "monto_recibido": 100.00
}
```

## Backend

- [ ] Validar que el pedido esté `Listo`.
- [ ] Evitar doble cobro.
- [ ] Registrar el pago y cambiar a `Pagado` en una transacción.
- [ ] Liberar la mesa en la misma transacción.
- [ ] Devolver comprobante/resumen.

## Móvil

- [ ] Crear `cajaService.js`.
- [ ] Mostrar únicamente pedidos Listos.
- [ ] Obtener detalle real.
- [ ] Enviar método y datos del pago.
- [ ] Mostrar total calculado por backend.
- [ ] Retirar el pedido de la cola después del cobro.

## Criterios de aceptación

- Un pedido Listo puede cobrarse una vez.
- El pedido cambia a Pagado.
- La mesa cambia a Libre.
- Estadísticas y reportes incluyen la venta.

---

# SET 7 — Dashboard y perfil

## Objetivo

Reemplazar estadísticas y perfil simulados.

## Endpoints

```text
GET /dashboard/
GET /estadisticas/
GET /auth/me
```

## Tareas

- [ ] Definir qué indicadores ve cada rol.
- [ ] Crear `dashboardService.js`.
- [ ] Adaptar respuestas a tarjetas existentes.
- [ ] Usar `/auth/me` para Perfil.
- [ ] Permitir editar solo campos autorizados.
- [ ] No calcular cifras financieras en el cliente.

## Criterios de aceptación

- Dashboard utiliza cifras de la base de datos.
- Cada rol ve información autorizada.
- Perfil muestra el usuario autenticado, no `initialUserProfile`.

---

# SET 8 — Dominios faltantes del backend

## Objetivo

Dar soporte real a las pantallas que todavía no tienen una entidad equivalente.

## 8.1 Insumos e inventario

Entidades:

- `Insumo`.
- `MovimientoInventario`.
- `UnidadMedida` opcional.

Operaciones:

```text
GET    /insumos/
POST   /insumos/
PUT    /insumos/{id}
DELETE /insumos/{id}
POST   /insumos/{id}/movimientos
GET    /insumos/stock-bajo
```

## 8.2 Compras

Entidades:

- `Compra`.
- `DetalleCompra`.
- `Proveedor` opcional.

Operaciones:

```text
GET  /compras/
POST /compras/
GET  /compras/{id}
PUT  /compras/{id}
```

Registrar una compra recibida debe incrementar inventario mediante movimientos auditables.

## 8.3 Gastos

Entidad `Gasto` con categoría, descripción, monto, fecha y usuario.

```text
GET    /gastos/
POST   /gastos/
PUT    /gastos/{id}
DELETE /gastos/{id}
```

## 8.4 Promociones/marketing

Entidad `Promocion` con vigencia, producto, precio/descuento y estado.

```text
GET    /promociones/activas
POST   /promociones/
PUT    /promociones/{id}
DELETE /promociones/{id}
```

## 8.5 Notificaciones y actividad

Entidades:

- `Notificacion` para avisos dirigidos.
- `EventoAuditoria` para historial del sistema.

```text
GET /notificaciones/
PUT /notificaciones/{id}/leer
GET /actividad/
```

## 8.6 Preferencias

- Preferencias visuales permanecen locales.
- Preferencias de negocio se guardan en backend.
- No mezclar configuración del dispositivo con reglas globales.

## Criterios de aceptación

- Inventario, compras, gastos, promociones y notificaciones sobreviven al reinicio.
- Web y móvil consultan las mismas entidades.
- Cada movimiento sensible registra usuario y fecha.

---

# SET 9 — Sincronización y tiempo real

## Objetivo

Evitar que los roles trabajen con información obsoleta.

## Fase inicial: polling

- Pedidos Mesero: cada 10 segundos.
- Cocina: cada 5 segundos.
- Caja: cada 5 segundos.
- Notificaciones: cada 15 segundos.
- Pausar polling cuando la aplicación esté en segundo plano.

## Fase posterior: WebSocket

Canales/eventos propuestos:

```text
pedido.creado
pedido.preparacion_iniciada
pedido.listo
pedido.pagado
pedido.cancelado
inventario.stock_bajo
```

## Reglas

- WebSocket notifica; la API REST sigue siendo fuente de verdad.
- Al reconectar se vuelve a consultar REST.
- Los eventos deben incluir identificador y versión/timestamp.

## Criterios de aceptación

- Cocina recibe un pedido nuevo sin recargar manualmente.
- Mesero ve cuándo un pedido está listo.
- Caja recibe pedidos Listos.
- Una reconexión no duplica datos.

---

# SET 10 — Pruebas, seguridad y observabilidad

## Backend

- [ ] Pruebas unitarias de services.
- [ ] Pruebas de routers con base de datos aislada.
- [ ] Prueba de permisos por rol.
- [ ] Prueba de transiciones de estado.
- [ ] Prueba de rollback del pedido completo.
- [ ] Prueba de doble cobro.
- [ ] Validación de CORS por entorno.
- [ ] Rate limit para login.
- [ ] Contraseñas y secretos solo en variables seguras.
- [ ] Logs sin tokens ni passwords.

## Móvil

- [ ] Pruebas de adaptadores.
- [ ] Pruebas del cliente HTTP y errores.
- [ ] Pruebas de restauración/cierre de sesión.
- [ ] Pruebas de pantallas loading/error/empty.
- [ ] Prueba del flujo Mesero → Cocina → Caja.
- [ ] Prueba sin conexión y posterior reintento.
- [ ] Accesibilidad de botones y formularios.

## Contrato/E2E

- [ ] Mantener colección Postman ejecutable.
- [ ] Crear datos seed reproducibles.
- [ ] Ejecutar flujo completo automáticamente.
- [ ] Verificar consistencia de stock, total, estado y mesa.

## Criterios de aceptación

- El flujo crítico pasa automáticamente.
- No hay credenciales en Git.
- Los errores tienen contexto suficiente para diagnóstico.

---

# SET 11 — Despliegue y operación

## API

- [ ] Usar dominio HTTPS estable.
- [ ] Configurar variables de producción.
- [ ] Ejecutar migraciones Alembic en despliegue.
- [ ] Configurar backups de PostgreSQL/Neon.
- [ ] Restringir CORS a dominios reales.
- [ ] Añadir health check y monitoreo.

## Móvil

- [ ] Crear `.env` para desarrollo y variables EAS para producción.
- [ ] Cambiar `EXPO_PUBLIC_API_URL` a HTTPS.
- [ ] Configurar identificadores Android/iOS.
- [ ] Generar build interno de pruebas.
- [ ] Validar en teléfono real antes de publicar.

## Operación

- [ ] Definir responsable de incidencias.
- [ ] Definir proceso de rollback.
- [ ] Definir retención de logs y auditoría.
- [ ] Documentar recuperación de base de datos.

## Criterios de aceptación

- Build móvil consume exclusivamente la API de producción.
- Ninguna URL local está incluida en producción.
- API, base y aplicación cuentan con procedimiento de recuperación.

---

# 6. Orden de ramas sugerido

```text
feat/set-01-infra
feat/set-02-auth-session
feat/set-03-catalog-tables
feat/set-04-full-orders
feat/set-05-kitchen
feat/set-06-cashier-payments
feat/set-07-dashboard-profile
feat/set-08-missing-domains
feat/set-09-realtime
test/set-10-hardening
chore/set-11-deployment
```

Cada rama debe ser pequeña, tener pruebas propias y fusionarse antes de iniciar dependencias posteriores.

# 7. Matriz de dependencias

| Set | Depende de |
| --- | --- |
| 0 | Ninguno |
| 1 | 0 |
| 2 | 1 |
| 3 | 2 |
| 4 | 2 y 3 |
| 5 | 4 |
| 6 | 4 y 5 |
| 7 | 2 |
| 8 | 2; puede dividirse por dominio |
| 9 | 4, 5 y 6 |
| 10 | Todos los módulos incluidos en la entrega |
| 11 | 10 |

# 8. Prioridades

## MVP operativo

Incluye Sets 0 a 7:

- Login real.
- Sesión persistente.
- Mesas y productos reales.
- Pedido completo.
- Cocina real.
- Caja y cobro.
- Dashboard/perfil básicos.

## Versión completa

Agrega Sets 8 a 11:

- Insumos.
- Compras.
- Gastos.
- Promociones.
- Notificaciones.
- Tiempo real.
- Pruebas y despliegue productivo.

# 9. Definición de terminado para cada set

Un set se considera terminado únicamente cuando:

- [ ] El código está integrado, no solo maquetado.
- [ ] No depende de datos mock para el flujo entregado.
- [ ] Maneja carga, vacío, error y éxito.
- [ ] Respeta permisos del rol.
- [ ] Tiene pruebas proporcionales al riesgo.
- [ ] La colección/documentación del contrato está actualizada.
- [ ] No contiene secretos ni credenciales.
- [ ] Funciona en al menos un teléfono físico.
- [ ] No rompe el panel web.
- [ ] Cumple sus criterios de aceptación.

# 10. Riesgos principales y mitigación

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Flujos diferentes entre móvil y API | Estados incoherentes | Cerrar Set 0 antes de implementar |
| Pedido parcial por múltiples requests | Stock y totales incorrectos | Endpoint transaccional `pedidos/completo` |
| Uso de `localhost` en teléfono | API inaccesible | URL por entorno y `0.0.0.0` en desarrollo |
| Token expuesto | Acceso no autorizado | SecureStore, HTTPS y logs sanitizados |
| Polling excesivo | Carga en API/batería | Intervalos por módulo y pausa en background |
| Modelos faltantes | Pantallas nuevamente simuladas | Implementar Set 8 por dominio |
| Doble acción del usuario | Pedido/cobro duplicado | Botones bloqueados, idempotencia y validación backend |
| Cambios que rompen web | Regresión | Contrato estable y pruebas integradas |

# 11. Primer corte recomendado

El primer corte debe abarcar Sets 0 a 4. Al terminarlo, un Mesero podrá:

1. Iniciar sesión con una cuenta real.
2. Consultar mesas libres.
3. Consultar productos activos.
4. Crear un pedido completo.
5. Ver el pedido persistido y su estado.

Ese corte valida la arquitectura completa de extremo a extremo antes de conectar Cocina, Caja y los módulos administrativos.
