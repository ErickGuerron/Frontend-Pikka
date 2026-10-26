# Cola de espera por cupo de zona: parte frontend (zone-capacity-queue)
Documento completo de la feature (specs, decisiones, plan y parcialidades): `odd/tasks/zone-capacity-queue.md` en Backend-Pikka, rama `feat/zone-capacity-queue`. Este archivo registra las tareas de frontend y lo que ya existe en la app.
Ramas: `feat/customer-queue-message` (esta PR, hacia `develop`). La base `feat/customer-driver-tracking` (PR #43) ya esta mergeada en `develop`.
Test runner: `apps/web`: `npx tsc -b --noEmit`, `npx vitest run`; `apps/mobile`: `npx tsc --noEmit`, `npx jest -w 1`; e2e: `npx playwright test -c playwright.mobile.config.ts` (no ejecutado en esta revision).

## Contexto para el equipo y para las IAs
- El frontend no decide reglas de cupo ni de privacidad. Solo presenta lo que el backend devuelve: `queuePosition` en el pedido del cliente, y el estado del pedido.
- Mensaje de cola ya implementado (web y movil): cuando un pedido PENDING espera cupo, la app muestra "Tu pedido es el #N en espera. La zona tiene su cupo de envios completo; se asignara a un repartidor de tu zona cuando se libere un envio." Sale de `pendingDriverNotice` en `apps/web/src/features/customer-orders/types.ts` y `apps/mobile/src/features/customer-orders/types.ts`.
- Cupo del repartidor ya existente en movil: `apps/mobile/src/app/(app)/ruta/index.tsx` muestra "Cupo: N de M pedidos" con N = `route.stops.length` y M = `route.maxOrders`. Ojo: cuenta por ruta; la regla de negocio (R1) es por zona. Ver la parte de S6 en el documento del backend.
- Los tests de e2e del mapa del repartidor movil ya validan el texto "Cupo: 7 de 10 pedidos" (`apps/web/e2e/mobile/mobile.spec.ts`).

## Specs (frontend)
S3 (R3, confirmado). Pedido programado, en web y movil: "Pedido programado para entregarse el <fecha> entre <ventana>. Lo asignaremos a un repartidor de tu zona ese dia."
S2-UI. Tras PICKED_UP el cliente ve al repartidor (posicion, ruta, ETA). Antes, solo el mensaje "Tu pedido esta asignado a un repartidor; aun no sale del local". El gateway es la fuente de verdad; la app solo presenta lo que recibe, no oculta datos por su cuenta como unica proteccion.
S6-UI. Pantalla del repartidor con "Cupo X de Y" usando la capacidad total de la zona (activos de la zona y fecha, no paradas de una ruta).

## Tasks
| ID | Specs | Estado | Commit / evidencia |
|---|---|---|---|
| F1 | cola (web y movil) | hecho parcial | 33ea1ee: mensaje de cola en web y movil (`pendingDriverNotice`, banner en `CurrentOrderCard`) |
| F2 | S3 | pendiente | texto de programados en web y movil; sin codigo |
| F3 | S2-UI | pendiente | depende de que el gateway oculte datos antes de PICKED_UP (backend S2, no implementado) |
| F4 | S6-UI | parcial | "Cupo: N de M" ya existe en movil (b03ac5d) por ruta; falta total por zona (depende de backend T7) |

## Implementado y verificado en esta revision
- `apps/web`: `tsc -b --noEmit` sin errores; `vitest run`: 47 archivos, 526 pruebas en verde.
- `apps/mobile`: `tsc --noEmit` sin errores; `jest -w 1`: 27 suites, 242 pruebas en verde.
- Playwright movil no se ejecuto en esta revision.

## Falta
- F2: texto de programados en web y movil.
- F3: presentacion de ruta y ETA solo desde PICKED_UP; hoy depende del gateway, que aun no oculta esos datos.
- F4: cupo por zona en lugar de por ruta; origen de M (`max_orders_per_route`) por confirmar.

## Como retomar (personas e IAs)
1. Leer primero el documento del backend (specs y decisiones) y luego este archivo.
2. Antes de tocar textos, revisar `pendingDriverNotice` en web y movil: el mensaje debe quedar identico en ambas apps.
3. Escribir la prueba primero (RED): en web `vitest`, en movil `jest`; luego implementar (GREEN).
4. No cambiar reglas de cupo en el frontend: solo presentar lo que devuelve el backend.
5. No hacer push ni merge sin permiso explicito.

## Log
L1: el origen de la feature y el texto literal de los requisitos no quedo guardado; se reconstruye desde Engram (#3579 a #3581). La fuente completa esta en el documento del backend (L1 ahi).
L2: se documentan las tareas pendientes de frontend antes de implementar F2 a F4 (commit 2f7d321).
L3: se abre PR hacia `develop` para revision del equipo. Se amplia el documento con el estado real de la app (cupo por ruta ya existente) y la verificacion de web y movil.
