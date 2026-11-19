# Pikka mobile (clientes)

Expo SDK 57 + Expo Router. This build is **customers only**: sign up, log in and "Mis pedidos".
Staff roles (ADMIN / OPERATOR / DRIVER) that log in are told the app is for customers and are signed out.
The old Despacho/Conductor/Admin login lives, unrouted, in `src/legacy/StaffLoginScreen.tsx`.

## Requirements

- Node 22.13+ and npm
- Docker (for the backend)
- Expo Go (SDK 57) on a physical device, or an Android emulator / iOS simulator

All dependencies are Expo Go compatible (expo-router, expo-secure-store, expo-font, expo-linking,
react-native-svg, react-native-screens, react-native-safe-area-context). No custom native module, so no
development build is needed. There is no map in this build (orders show the address only).

## Run

```bash
cd Frontend-Pikka/apps/mobile
npm install
cp .env.example .env        # then edit EXPO_PUBLIC_API_URL (see below)
```

Start the backend (gateway host port is `GATEWAY_PORT`, default **8080**):

```bash
cd Backend-Pikka
docker compose up -d --build
```

Start the app:

```bash
npx expo start              # add -c to clear the Metro cache
```

- Android emulator: press `a`.
- iOS simulator (macOS): press `i`.
- Physical device: install Expo Go, put the phone on the **same Wi-Fi** as the PC and scan the QR code.

## Environment variables

`EXPO_PUBLIC_*` values are inlined at bundle time: after changing `.env` restart with `npx expo start -c`.

| Variable | Meaning |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Gateway **origin** only, no `/api/v1` (the app adds `/api/v1/...`). Default `http://localhost:8080`. |
| `EXPO_PUBLIC_MOCK_CUSTOMER_ORDERS` | `true` = in-memory DEMO orders (labelled "DEMO · datos simulados"). Default `false`. |
| `EXPO_PUBLIC_MOCK_DRIVER_ROUTE` | `true` = in-memory DEMO route for the driver ("Mi ruta"). Default `false`. |

Gateway URL by target:

| Target | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| Android emulator | `http://10.0.2.2:8080` |
| iOS simulator | `http://localhost:8080` |
| Physical device (Expo Go) | `http://<LAN-IP-of-your-PC>:8080` (`ipconfig` on Windows) |

## Orders backend status

The Gateway serves the customer endpoints: `GET /api/v1/orders/mine`, `POST /api/v1/orders` and `POST /api/v1/orders/{id}/cancel`
(CUSTOMER role). `src/features/customer-orders/api.ts` uses them. Set `EXPO_PUBLIC_MOCK_CUSTOMER_ORDERS=true` to use the in-memory demo instead.
The order in progress shows live tracking from `GET`/WebSocket `/api/v1/orders/{id}/tracking`: the WebSocket sends the snapshot on
connect and on each change, using the `pikka.v1` subprotocol plus the JWT. The tracking section is hidden in demo mode.
The order form does not collect coordinates (no map/geocoder) and order notes are UI-only.

## Driver route backend status

The Gateway still has **no driver route endpoints**: `GET /api/v1/drivers/me/route` and `POST /api/v1/drivers/me/routes/{routeId}/stops/{stopId}/result`
answer 501. `src/features/driver-route/api.ts` targets them. With
`EXPO_PUBLIC_MOCK_DRIVER_ROUTE=true` the screen runs on a demo route. Each result captures the driver's GPS position with `expo-location` (ADR 0007) at the moment it is
registered, using foreground permission only. If the driver refuses, the result is not sent.
The driver can mark each stop "recogido" and "en camino" before the result. Those two steps call
`PATCH /api/v1/drivers/me/routes/{routeId}/stops/{stopId}/status`, which the Gateway serves and answers with `{stopId, status}`.
The stop is reachable only once the route endpoint exists.

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm test            # jest-expo
npx expo-doctor
```

## Common pitfalls

- **`localhost` on a device/emulator** points to the device itself, not your PC. Use `10.0.2.2` (Android emulator) or the PC LAN IP.
- **Windows firewall**: allow inbound TCP 8080 (and the Metro port 8081) for the private network, otherwise a physical device times out.
- **Cleartext `http://`**: works in Expo Go and debug builds. Release builds block cleartext HTTP on Android and iOS (ATS); use HTTPS there.
- **Env change not applied**: restart with `npx expo start -c`.
- **Phone cannot connect to Metro**: same Wi-Fi, no VPN/guest-network client isolation; or use `npx expo start --tunnel`.
- Sessions are stored with `expo-secure-store` (native) and `localStorage` on web.
