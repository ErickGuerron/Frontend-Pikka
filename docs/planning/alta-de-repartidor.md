# Alta de repartidor: qué debe tener el frontend

Estado: especificación. El backend ya expone el endpoint (rama `feat/driver-profile` de Backend-Pikka, commit `bc7ffbe`, sin push ni PR todavía). Este documento describe lo que falta en la web.

## 1. Alcance

- **Web:** formulario para que un ADMIN dé de alta un repartidor con su perfil completo, y el listado de repartidores con esos datos.
- **Móvil:** sin cambios. El repartidor solo inicia sesión; sus datos personales no se muestran ni se editan en la app.
- **Fuera de alcance:** editar el perfil de un repartidor existente, borrarlo y subir foto o documentos. El backend no tiene esas operaciones.

## 2. Contrato

`POST /api/v1/drivers`, solo rol `ADMIN`. Un OPERATOR recibe 403.

Petición (JSON):

| Campo | Tipo | Regla que aplica el backend |
|---|---|---|
| `email` | string | Correo del usuario. Debe ser único en todo el sistema |
| `password` | string | 8 a 72 caracteres |
| `firstName` | string | Obligatorio, máximo 50 |
| `lastName` | string | Obligatorio, máximo 50 |
| `birthDate` | string | `YYYY-MM-DD`, mínimo 18 años cumplidos |
| `phone` | string | Contacto: 7 a 15 dígitos, `+` opcional al inicio. Se quitan espacios y guiones |
| `vehicleType` | string | `MOTORIZADO`, `AUTOMOVIL` o `SUV` |
| `identifier` | string | Documento de identidad: 5 a 20 letras o dígitos, único. Se guarda en mayúsculas |
| `plate` | string | Placa: 5 a 8 letras o dígitos, única. Se acepta con guion y se guarda sin él, en mayúsculas |
| `city` | string | Obligatorio, máximo 80 |

Respuesta `201`: `{ user: User, driver: DriverProfile }`. `DriverProfile` trae `id`, `userId`, los campos anteriores normalizados, `active`, `status` (`AVAILABLE` al crear) y `createdAt`.

Errores (`{ error: { code, message, requestId } }`):

| HTTP | Cuándo | Qué muestra el front |
|---|---|---|
| 400 | Dato inválido, menor de 18 o fecha/vehículo mal formados | Mensaje en el campo que corresponda |
| 401 / 403 | Sin sesión o rol distinto de ADMIN | Redirigir a login / pantalla sin permiso |
| 409 | Correo, identificador o placa ya registrados | Mensaje claro. El `message` no dice cuál campo repite; ver sección 5 |
| 503 | Auth o Driver Service caído | "Servicio no disponible, intenta de nuevo" |

El contrato completo está en `contracts/openapi/openapi.yaml` del backend (`createDriver`, `CreateDriverRequest`, `DriverProfile`).

## 3. Formulario

Ubicación sugerida: `apps/web/src/features/drivers/CreateDriverPage.tsx`, ruta `/drivers/new`, dentro de `RequireSection section="drivers"` pero visible solo para ADMIN (hoy `users` es el único que es solo ADMIN; añadir una sección nueva o un guard específico en `permissions.ts`). Botón "Nuevo repartidor" en `DriversPage`, visible solo para ADMIN.

Secciones del formulario:

1. **Datos personales:** nombre, apellido, fecha de nacimiento (input `date` con `max` = hoy menos 18 años), documento de identidad, teléfono de contacto, ciudad.
2. **Vehículo:** tipo (selector con tres opciones: Motorizado, Automóvil, SUV) y placa.
3. **Cuenta de acceso:** correo y contraseña inicial.

Validación en el cliente (solo para ayudar; la autoridad es el backend):

- Reutilizar los validadores existentes: `shared/validation/contact.ts` para el teléfono y `features/auth/signup-validation.ts` para correo y contraseña.
- Nuevos validadores en `features/drivers/validation.ts`: edad mínima 18, documento (5–20 alfanuméricos), placa (5–8 alfanuméricos, aceptar guion), tipo de vehículo.
- Mostrar el error bajo cada campo, con `aria-describedby` y `aria-invalid`. Sin `any`, sin fetch en el componente: usar `shared/api/client` y un hook con TanStack Query (`useMutation`).
- Enviar `vehicleType` con los valores del backend; las etiquetas en español solo se usan para mostrar.

Estados:

- **Enviando:** botón deshabilitado y con texto de progreso. Evita doble envío: un segundo POST con el mismo correo da 409 y deja un usuario inactivo.
- **Éxito:** volver al listado y mostrar un aviso con el nombre del repartidor creado. Invalidar la consulta de repartidores.
- **Error:** conservar lo escrito. No limpiar la contraseña salvo que sea 401.

## 4. Listado de repartidores

Implementado. `GET /api/v1/drivers` (ADMIN y OPERATOR) llega con Backend-Pikka#57 y devuelve nombre, teléfono, ciudad, tipo de vehículo, placa, estado y si está activo. No trae fecha de nacimiento ni documento. La tabla de `DriversPage` muestra esas columnas y busca por nombre, teléfono, ciudad o placa. `VITE_MOCK_DRIVERS=true` mantiene una lista de muestra para desarrollar sin backend.

## 5. Limitaciones del backend que el front debe respetar

- **Dos servicios, sin transacción.** Si el perfil falla, el gateway desactiva el usuario recién creado. El correo queda reservado: el reintento con el mismo correo da 409 aunque el alta nunca se completó. El formulario debe sugerir usar otro correo ante un 409 y no prometer que "el correo está libre".
- **El 409 no dice qué campo repite.** Hasta que el backend lo distinga, el mensaje es genérico: "Correo, documento o placa ya registrados".
- **No hay edición ni baja de perfil.** Para dar de baja a un repartidor se usa `DELETE /api/v1/users/{id}`, que lo desactiva.
- **No hay idempotencia.** No reintentar automáticamente un POST fallido.

## 6. Pruebas

Vitest + React Testing Library (alineado con los tests actuales en `drivers.test.tsx` y `users.test.tsx`):

- Validación: menor de 18 por un día falla, exactamente 18 pasa; placa con guion se acepta; vehículo vacío falla.
- Envío correcto: el cuerpo del POST lleva los campos con los nombres del contrato y `vehicleType` en español.
- 400, 409 y 503 muestran el mensaje esperado y conservan el formulario.
- Un OPERATOR no ve el botón ni accede a `/drivers/new`.
- Botón deshabilitado mientras se envía (no se manda dos veces).

Playwright (`apps/web/e2e`): flujo ADMIN crea repartidor y aparece en el listado. Requiere que el listado (sección 4) exista.

## 7. Orden de trabajo sugerido

1. Backend: mergear Backend-Pikka#57.
2. Web: tipos y `api.ts` del alta (`createDriver`), validadores y sus tests.
3. Web: página del formulario y ruta, con permisos.
4. Web: listado con los campos nuevos y e2e.

## 8. Datos de prueba

El backend siembra un repartidor para desarrollo: **Lucas Martinez**, 27 años, motorizado, ciudad Quito, correo `repartidor@pikka.com`. Sirve para probar el listado sin crear nada. No usar sus credenciales en entornos reales.
