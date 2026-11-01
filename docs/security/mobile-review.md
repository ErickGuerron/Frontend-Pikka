# Revisión de seguridad móvil y decisión de sesión

Sprint 3 y Sprint 6 (Mabe): decisión de sesión y almacenamiento del token, y revisión de seguridad de la app.
Alcance: `apps/mobile` (clientes y repartidores).

## Decisión de sesión

- El token de acceso se guarda con `expo-secure-store` en Android e iOS. Está en `src/store/secure-storage.ts`.
- En la web de Expo no existe SecureStore; se usa `localStorage` como respaldo. El respaldo nunca lanza error.
- Un 401 con token borra la sesión local (`src/api/client.ts`; `http.ts` lo notifica). Cerrar sesión borra el token y el estado del pedido.
- No se usa `sessionStorage` en ningún caso.

## Riesgos conocidos

| Riesgo | Dónde | Estado |
| --- | --- | --- |
| Token en `localStorage` en la web de Expo | `secure-storage.ts` | Aceptado para el MVP. Cualquier script de la página lo lee; mitigar con CSP estricta en el despliegue web y sin contenido de terceros. |
| Sin expiración de sesión del lado del cliente | `session-store.ts` | Pendiente. La app espera el 401 del servidor; no hay renovación. |
| Comunicación en claro en desarrollo | `src/api/config.ts`, default `http://localhost:8080` | Aceptado solo en desarrollo. En producción la URL debe ser `https://`. |
| Ubicación GPS del repartidor | `src/features/driver-route/location.ts` | Implementado: solo permiso en uso, se pide al registrar cada resultado y no se guarda historial en el dispositivo. |

## HTTPS

- La app no fuerza HTTPS. El valor viene de `EXPO_PUBLIC_API_URL`. En producción debe ser `https://`, y eso se
  revisa en el pipeline de build, no en el código.
- iOS bloquea texto plano por defecto (App Transport Security). No revisé la configuración de Android para tráfico
  en claro; hay que confirmarla antes de publicar.

## Datos que no se guardan en el dispositivo

- Contraseñas: nunca.
- Historial de paradas y resultados: solo en memoria mientras la pantalla está abierta; el servidor es la fuente.
- Los motivos de no entrega son de lista cerrada; no se guarda texto libre del repartidor.

## Pruebas

- `__tests__/driver-route.test.ts`: reglas de resultados por parada, validación de motivos y respuesta de conflicto.
- `__tests__/guards.test.ts`: cada rol solo entra a su sección.
- `__tests__/auth-screens.test.tsx`: el personal no obtiene sesión; un repartidor sí.

## Pendientes

- Revisión con la app en dispositivo o emulador. No se ha hecho.
- Renovación o expiración de sesión del lado del cliente.
- Revisar el texto del permiso de ubicación en iOS y Android antes de publicar.
