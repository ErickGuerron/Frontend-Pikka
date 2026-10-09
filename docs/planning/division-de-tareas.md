# División de tareas de frontend por sprints (2 semanas)

Equipo: **Xabier** (Frontend), **Erick** (Full stack), **Mabe** (Full stack).
Anthony (Backend) no tiene tareas de frontend, pero su trabajo habilita los endpoints que aquí se consumen.

Base: `Backend-Pikka/docs/planning/division-de-tareas.md` (plan completo del equipo) y `docs/architecture/BASE_TECNICA.md` (secciones 4, 21, 22, 23, 31).

Las fechas de inicio se definen al arrancar el Sprint 1.

## Cómo se trabaja en el frontend

- **Contrato primero:** cada pantalla consume endpoints ya definidos en el OpenAPI del Gateway (`/openapi.yaml`). Si falta un endpoint, se pide a Backend antes de simular datos.
- **Sin HTTP en componentes:** todas las llamadas pasan por `shared/api/http.ts` y los `api.ts` de cada feature. ESLint lo verifica.
- **Respuestas validadas en runtime** (`shared/api/parse.ts`). Prohibido usar type assertions.
- **Pruebas:** Vitest + React Testing Library en cada componente nuevo; Playwright para flujos completos (en web, con el Gateway simulado).
- **Quality gate por PR:** `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, y E2E cuando toque un flujo.
- **Un PR = un alcance pequeño**, revisado por otra persona del equipo.

## Sprint 1: pedidos y base de la app móvil

| Persona | Tarea | Entregable |
|---|---|---|
| Xabier | Web: listado y alta de pedidos (`features/orders`) sobre `POST/GET /api/v1/orders` | Pantallas con pruebas Vitest |
| Xabier | Web: mocks de Playwright para el flujo de pedidos (el Gateway se simula) | Pruebas E2E que corren sin backend |
| Xabier | Lint y typecheck estrictos en las nuevas pantallas | CI verde |
| Erick | Revisar `shared/api` para que el cliente cubra los nuevos endpoints de pedidos y zonas | Cliente tipado y validado |
| Mabe | Diseño de navegación y pantallas de la app de repartidor (`apps/mobile`), sin código todavía | Wireframes aprobados por el equipo |

**Criterio de cierre:** el listado y el alta de pedidos funcionan contra el Gateway y contra mocks; CI verde.

## Sprint 2: zonas, repartidores y arranque de la app móvil

| Persona | Tarea | Entregable |
|---|---|---|
| Xabier | Web: zonas (lista y edición) y repartidores (listado) | Pruebas Vitest y Playwright |
| Xabier | Web: E2E de crear y consultar pedidos | Test E2E verde |
| Erick | Web: selector de zona en el alta de pedidos, con clasificación por coordenadas (`ClassifyPoint`) | Componente con pruebas |
| Mabe | Mobile: scaffolding de `apps/mobile` (React Native + TypeScript, Vertical Slices, sección 21) | La app arranca con pantalla de login |
| Mabe | Mobile: pantalla de login y almacenamiento del token | Pruebas Jest y RNTL |

**Criterio de cierre:** zonas y repartidores visibles en la web; la app móvil arranca y autentica contra el Gateway.

## Sprint 3: generación de rutas (web) y seguridad del cliente

| Persona | Tarea | Entregable |
|---|---|---|
| Xabier | Web: botón para generar rutas (`POST /api/v1/route-plans/generate`) con estados de carga y error | Pruebas Vitest |
| Xabier | Web: vista de rutas generadas (`features/routing`) | Pruebas Vitest y E2E |
| Erick | Web: manejo de conflictos de asignación (respuestas 409) con mensajes claros | Pruebas de componente |
| Mabe | Mobile: estrategia de sesión y almacenamiento seguro del token (sin `sessionStorage`) | Decisión documentada y prueba |
| Xabier | **OWASP:** revisar que la web no muestre datos que el rol no debe ver (correo, datos de otra empresa) | Lista de verificación firmada |

**Criterio de cierre:** el flujo de generar y ver rutas funciona; la revisión de datos visibles está hecha.

## Sprint 4: pedidos de último momento y ajustes manuales

| Persona | Tarea | Entregable |
|---|---|---|
| Xabier | Web: vista de pedidos de último momento y ajustes manuales autorizados | Pruebas Vitest |
| Erick | Web: manejo de versiones (`version`) con reintento o aviso al usuario ante conflicto de edición | Pruebas de componente |
| Mabe | Mobile: login y ruta asignada (`GET /drivers/me/route`), con orden de paradas | Pruebas Jest |

**Criterio de cierre:** pedidos tardíos y ajustes visibles y operables; el conflicto de edición se comunica al usuario.

## Sprint 5: seguimiento en vivo y entregas

| Persona | Tarea | Entregable |
|---|---|---|
| Xabier | Web: seguimiento en vivo por WebSocket del Gateway, con fallback REST y reconexión | Pruebas de reconexión |
| Erick | Cliente HTTP: `Idempotency-Key` (UUID por intento) para crear pedido y generar rutas | Pruebas de reintento |
| Mabe | Mobile: marcar recogido, en camino y entregado; progreso de la ruta | Pruebas Jest y RNTL |

**Criterio de cierre:** la web refleja cambios de estado en vivo y, si el WebSocket cae, recupera el estado por REST.

## Sprint 6: calidad y cierre

| Persona | Tarea | Entregable |
|---|---|---|
| Xabier | **Playwright E2E:** login, crear pedido, crear zona, generar rutas, visualizar ruta, cambio de estado | Suite E2E verde |
| Erick | Calidad del frontend: `tsc --noEmit`, ESLint y cobertura de Vitest en el Quality Gate | Gate aprobado |
| Mabe | **OWASP (móvil):** revisar almacenamiento del token y comunicación HTTPS; pruebas Jest de flujos de entrega | Reporte de revisión |
| Todos | Revisión de accesibilidad básica en las pantallas principales | Lista de hallazgos resueltos |

**Criterio de cierre:** suite E2E verde, quality gate aprobado y revisión de seguridad móvil archivada.

## Riesgos del frontend

- **Dependencia del backend:** si un endpoint no está listo, la pantalla se construye contra mocks y se marca como pendiente de integración.
- **Playwright y backend:** los E2E de los sprints 1 a 3 usan el Gateway simulado; el E2E completo de Sprint 6 requiere el backend levantado.
- **Alcance de la app móvil:** solo Mabe trabaja en `apps/mobile`. Si su carga de backend aumenta, se reprograma la app y no se reparte sin acuerdo del equipo.
