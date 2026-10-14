# Revisión de datos visibles por rol en la web

Sprint 3 (Xabier, retirado del proyecto; revisión retomada por el equipo). Objetivo del plan: que la web no
muestre datos que el rol no debe ver (correo, datos de otra empresa). Alcance: `apps/web`.

## Regla de control

La web solo controla navegación y consultas (`src/features/auth/permissions.ts`, ADR 0008). **La autorización
real la aplica cada servicio en la API.** Esta revisión verifica ambas partes: qué oculta la web y qué debe
rechazar el servidor.

## Matriz de acceso por sección

| Sección | Roles | Control en la web | Control en la API |
| --- | --- | --- | --- |
| Pedidos (`orders`) | ADMIN, OPERATOR | `permissions.ts` | `/api/v1/orders` solo personal (openapi) |
| Excepciones | ADMIN, OPERATOR | `permissions.ts` | `/api/v1/orders/exceptions` solo personal |
| Zonas | ADMIN, OPERATOR | `permissions.ts` | Pendiente de confirmar en Zone Service |
| Rutas | ADMIN, OPERATOR | `permissions.ts` | `/api/v1/route-plans/*` no existe todavía |
| Repartidores | ADMIN, OPERATOR | `permissions.ts` | `/api/v1/drivers` no existe todavía |
| Seguimiento | ADMIN, OPERATOR | `permissions.ts` | `/api/v1/tracking/*` no existe todavía |
| Usuarios | solo ADMIN | `permissions.ts` | `/api/v1/users` y `/api/v1/customers` con AdminOnly en el Gateway |
| Mis pedidos | solo CUSTOMER | `permissions.ts` | `/api/v1/orders/mine` no existe todavía |

## Datos sensibles y quién los ve

| Dato | Quién lo ve en la web | Evidencia | Pendiente |
| --- | --- | --- | --- |
| Correo y datos de usuarios | ADMIN | Sección Usuarios solo ADMIN (`permissions.ts`) | Ninguno |
| Teléfono del repartidor | ADMIN y OPERATOR, en Repartidores | `DriversPage.tsx` muestra el teléfono | **Decisión:** el contrato `drivers.v1` minimiza datos en la búsqueda gRPC y expone nombre y teléfono solo a quien reserva. Confirmar si el operador debe ver el teléfono. |
| Pedidos del cliente | Personal, en Pedidos y Excepciones | Sección solo staff | El cliente solo debe ver sus pedidos: `/orders/mine` debe filtrar por el usuario del token en el servidor. |
| Ubicación de las paradas | Personal, en Rutas y Seguimiento | Secciones solo staff | Ninguno |
| Datos de otra empresa | No aplica: el sistema es de una sola empresa | Revisión del modelo | Ninguno |

## Qué ve el cliente

- Solo la sección `myOrders`. No puede abrir Pedidos, Excepciones, Zonas, Rutas, Repartidores, Seguimiento ni Usuarios.
- Un cliente que escribe una ruta de personal recibe redirección, no el contenido.
- Las pruebas de permisos cubren esta regla (`features/auth/permissions.test.ts`).

## Qué ve el repartidor

- La web lo manda a la app móvil. Ninguna sección de la web queda abierta para el rol `DRIVER` (ADR 0007).

## Pendientes antes de firmar la revisión

1. Confirmar con el equipo si el operador puede ver teléfonos de repartidores (ver tabla).
2. Verificar en el servidor, cuando existan, que `/orders/mine` y `/tracking/*` filtren por el usuario del token.
3. Confirmar la autorización por rol de `/api/v1/zones` en el Zone Service.

Esta revisión no reemplaza las pruebas de API. La firma queda pendiente hasta cerrar los puntos anteriores.
