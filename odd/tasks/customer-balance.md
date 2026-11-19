# Saldo del cliente: recargos, pago simulado y bloqueo (customer-balance)
Documento completo de la feature (specs, decisiones y pendientes): `odd/tasks/penalty-engine.md` y el ADR 0006 (`docs/adr/0006-recargo-por-rechazo-con-cobro-simulado.md`) en Backend-Pikka. Este archivo registra la parte frontend (tarea T10).
Rama: `feat/customer-balance` (hacia `develop`).
Test runner: `apps/web`: `npx tsc -b --noEmit`, `npx eslint .`, `npx vitest run`; `apps/mobile`: `npx tsc --noEmit`, `npx jest -w 1`.

## Contexto para el equipo y para las IAs
- El frontend no decide reglas de recargo, plazo ni bloqueo. Solo presenta lo que el backend devuelve y envia la accion de pagar.
- Contrato (Gateway, rol CUSTOMER), en `contracts/openapi/openapi.yaml` del backend, etiqueta `surcharges`:
  - `GET /api/v1/customers/me/balance` -> `{ pendingSurcharge, accountStatus, blocked, simulated, lines[] }`. Cada linea: `{ kind, id, orderId?, reason, amount, startedAt, dueAt }`. Una cuenta bloqueada TAMBIEN puede consultarlo.
  - `POST /api/v1/customers/me/balance/payment` -> `{ status, simulated, amount, reference, unblocked, createdAt }`. Sin cuerpo: se paga el saldo completo, no se elige el monto.
- El dinero llega como texto decimal con dos decimales (`"7.50"`). Nunca se convierte a `number` para mostrarlo ni para compararlo.
- Todo cobro es simulado (ADR 0006 seccion 4): la interfaz lo dice siempre cerca del boton de pagar. No se pide ni se muestra ningun dato de tarjeta.
- `reason` es un codigo cerrado (`CLIENT_REFUSED`, `CLIENT_ABSENT`, `OUT_OF_WINDOW`, `WRONG_ADDRESS`, `RECIDIVISM`). Un codigo nuevo o desconocido se muestra con un texto generico, nunca el codigo crudo. Del recargo extra el cliente ve `RECIDIVISM`, no la justificacion del operador.
- Mientras el backend no este desplegado (404/501/502/503/504) o falle la lectura, la tarjeta de saldo no se muestra y la pagina de pedidos sigue funcionando.

## Specs (frontend)
S1. Tarjeta "Tu saldo" en Mis Pedidos con el total, cada linea (motivo legible, monto, fecha limite de pago) y el aviso permanente de pago simulado. Sin deuda y sin mensaje pendiente, no ocupa espacio.
S2. Cuenta `blocked`: aviso visible de que no puede crear ni cancelar pedidos hasta pagar, y el boton "Hacer nuevo pedido" deshabilitado.
S3. Boton "Pagar saldo": paga el saldo completo. Resultados: aprobado (con aviso de que la cuenta volvio a estar activa si `unblocked`), rechazado por la tarjeta simulada (no cambia nada, se puede reintentar), sin saldo (422) y saldo cambiado mientras se pagaba (409, el cobro se devolvio).
S4. Tras pagar se refresca el saldo y los pedidos.

## Tasks
| ID | Specs | Estado | Evidencia |
|---|---|---|---|
| W1 | S1-S4 (web) | hecho | `BalanceCard`, `balance.ts`, `payment-outcome.ts`, hooks y `api.ts` en `apps/web/src/features/customer-orders`; `tsc -b --noEmit` limpio, `eslint .` sin errores, `vitest run` 56 archivos / 593 pruebas en verde |
| M1 | S1-S4 (movil) | hecho | `BalanceCard` (presentacional), `balance.ts`, `balance-hooks.ts`, `payment-outcome.ts` y `api.ts` en `apps/mobile/src/features/customer-orders`, montado en la pestana Pedidos de `mis-pedidos/index.tsx`; `tsc --noEmit` limpio, `jest -w 1` 32 suites / 291 pruebas en verde |

## Fuera de alcance
- La linea de saldo dentro de la respuesta de crear pedido (`pendingSurcharge`): la tarjeta de saldo de la misma pagina ya lo cubre.
- Pago parcial, pago en efectivo desde la app, recargo por reasignacion (backend T5) y aviso de recargo en la app: no existen en el backend.

## Log
L1: "Sí, T10 ahora" (tras T9 del backend: el cliente ya puede ver y pagar su saldo por API).
L2: W1 hecho. Decisiones: (1) si la lectura del saldo falla (404/501/502/503/504, 500 o una respuesta que no cumple el contrato) la tarjeta no aparece y la pagina de pedidos sigue igual; (2) el boton "Hacer nuevo pedido" se deshabilita con la cuenta bloqueada, pero el cancelar NO se bloquea en la interfaz: si el servidor lo rechaza (403) se vera el error generico de cancelar; (3) el mensaje del pago sobrevive a la desaparicion de la tarjeta (tras un pago aprobado el saldo queda en cero); (4) en modo demo no se llama al servicio de saldo. El cliente HTTP manda `body: null` cuando no hay cuerpo; la prueba comprueba que no se envia monto.
L3: M1 hecho, con la misma logica que la web (parseo, textos, resultados del pago) y la misma politica: si la lectura del saldo falla la tarjeta no aparece; "Hacer nuevo pedido" se deshabilita con la cuenta bloqueada; el mensaje del pago sobrevive a la desaparicion de la tarjeta; el modo demo no llama al servicio. Patron contenedor/presentacional: la pantalla posee los hooks y `BalanceCard` solo pinta. Se probo ademas que el pago hace POST sin cuerpo, que un segundo toque durante el pago se ignora y que la tarjeta no tiene ningun campo de texto (recorrido del arbol renderizado, con su prueba de sensibilidad). Limites honestos: no se probo contra el backend real (sus PRs #81 a #92 siguen abiertos) ni en un dispositivo; el cancelar un pedido no se bloquea en la interfaz, solo lo rechaza el servidor.
