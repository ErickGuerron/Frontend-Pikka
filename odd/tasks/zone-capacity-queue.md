# Cola de espera por cupo de zona: parte frontend (zone-capacity-queue)
Documento completo de la feature (specs, plan, justificacion y parcialidades): `odd/tasks/zone-capacity-queue.md` en Backend-Pikka, rama `feat/zone-capacity-queue`. Este archivo solo registra las tareas de frontend.
Rama: `feat/customer-queue-message`, apilada sobre `develop` (PR #43 ya mergeada). Sin push de PR ni merge sin permiso explicito.
Test runner: typecheck, `jest -w 1`, `vitest --no-file-parallelism`, playwright mobile.

## Specs (frontend)
S3 (R3, confirmado). Pedido programado, en web y movil: "Pedido programado para entregarse el <fecha> entre <ventana>. Lo asignaremos a un repartidor de tu zona ese dia."
S2-UI. Tras PICKED_UP el cliente ve al repartidor (posicion, ruta, ETA). Antes, solo el mensaje "Tu pedido esta asignado a un repartidor; aun no sale del local". El backend (gateway) es la fuente de verdad; la app solo presenta.
S6-UI. Pantalla del repartidor con "Cupo X de Y" usando la capacidad total de la zona (dato del backend por confirmar).

## Tasks
| ID | Specs | Estado | Commit / evidencia |
|---|---|---|---|
| F1 | cola (web y movil) | hecho parcial | 33ea1ee: muestra el lugar en la cola cuando la zona no tiene cupo (web y movil) |
| F2 | S3 | pendiente | - |
| F3 | S2-UI | pendiente | depende de que el gateway oculte datos antes de PICKED_UP (backend S2) |
| F4 | S6-UI | pendiente | depende del contrato de capacidad de zona |

## Log
L1: el origen de la feature y el texto de los requisitos estan en el documento del backend (L1 ahi). Este archivo se publica como registro de la parte frontend, sin cambios de codigo.
L2: se documentan las tareas pendientes de frontend antes de implementar F2 a F4.
