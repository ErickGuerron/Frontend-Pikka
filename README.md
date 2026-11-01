# Frontend-Pikka

Clientes del sistema Pikka de entregas y rutas de última milla. El backend
(API Gateway y microservicios en Go) vive en
[Backend-Pikka](https://github.com/ErickGuerron/Backend-Pikka).

| App | Tecnología | Usuarios | Estado |
|---|---|---|---|
| `apps/web` | React + TypeScript (Vite) | operadores, despachadores, administradores | Base lista (Fase 1) |
| `apps/mobile` | React Native + TypeScript | repartidores | Fase 3 |

## Web: arranque

Requisitos: Node 22 y el backend corriendo (`make up` en Backend-Pikka, que
expone el Gateway en `http://localhost:8080`).

```bash
cd apps/web
npm install
npm run dev          # http://localhost:5173, reenvía /api al Gateway
```

Si el Gateway no está en el puerto 8080 (por ejemplo, `GATEWAY_PORT=8081` en el
`.env` del backend), crea `apps/web/.env.local` con:

```env
VITE_DEV_GATEWAY_URL=http://localhost:8081
```

y reinicia `npm run dev`. Si el front no alcanza al Gateway, el login muestra
"No se pudo conectar con el backend".

Entra con el administrador inicial definido en el `.env` del backend
(`BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`).

## Web: comandos

```text
npm run typecheck    tsc en modo estricto
npm run lint         ESLint (typescript-eslint strict)
npm test             Vitest + React Testing Library
npm run test:e2e     Playwright (simula el Gateway, no necesita backend)
npm run build        build de producción en dist/
```

## Web: estructura

Sigue la sección 23 de la base técnica:

```text
apps/web/src/
├── app/            providers, router, layout, página de inicio
├── features/
│   ├── auth/       login, sesión (token), guards por rol
│   ├── users/      alta de usuarios (solo ADMIN)
│   ├── orders/     Fase 2
│   ├── zones/      Fase 2
│   ├── drivers/    Fase 3
│   ├── routing/    Fase 4
│   └── tracking/   Fase 6
├── shared/
│   ├── api/        cliente HTTP único, errores del Gateway, validación de respuestas
│   ├── config/     variables de entorno
│   └── ui/         componentes compartidos
└── assets/
```

## Decisiones

- **Datos del servidor con TanStack Query, estado local con Zustand.** Zustand solo guarda
  el token; el usuario actual lo trae `GET /api/v1/auth/me` (sección 22: no se
  duplica en Zustand lo que ya administra Query).
- **Sin HTTP en componentes.** Todas las llamadas pasan por `shared/api/http.ts` y
  los `api.ts` de cada feature. ESLint prohíbe `fetch` fuera de ese archivo.
- **Respuestas validadas en tiempo de ejecución** (`shared/api/parse.ts`) en lugar
  de type assertions, que también están prohibidas por ESLint.
- **Los guards por rol solo ordenan la navegación.** El backend es quien autoriza
  (sección 26.2); el front nunca sustituye esa validación.
- **El token vive en `sessionStorage`** y se borra al recibir un 401 o al cerrar sesión.
- **En desarrollo, Vite reenvía `/api` al Gateway**, así no hace falta CORS. En
  producción se define `VITE_API_BASE_URL` o se sirve detrás del mismo dominio.
