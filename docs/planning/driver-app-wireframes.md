# Wireframes de la app del repartidor

Alcance de Sprint 1 (frontend, Mabe): navegación y pantallas del repartidor dentro de la app móvil única
(ADR 0007). Son bocetos para aprobación; no definen estilos.

## Navegación

- Login: el mismo de cliente. Un `DRIVER` entra a **Mi ruta**; un `CUSTOMER` entra a **Mis pedidos**.
- El personal (`ADMIN`, `OPERATOR`) se rechaza con el mensaje "Esta app es para clientes y repartidores".
- Sección única por rol: un repartidor que intenta abrir `/mis-pedidos` vuelve a **Mi ruta**, y viceversa.

## Pantalla 1: Mi ruta

```
+------------------------------------------+
| Hola, Nombre Apellido                    |
| Ruta de hoy · 4 paradas pendientes       |
| [DEMO · datos simulados]                 |
+------------------------------------------+
| (1)  Av. Amazonas N24-03, Quito          |
|      Ventana 09:00 – 12:00   Pendiente   |
|      [ Entregado ]  [ No entregado ]     |
+------------------------------------------+
| (2)  Calle Juan León Mera 1224           |
|      Ventana 09:00 – 12:00   Pendiente   |
|      [ Entregado ]  [ No entregado ]     |
+------------------------------------------+
| (3)  Av. 6 de Diciembre 2540             |
|      Ventana 12:00 – 15:00   Entregado   |
+------------------------------------------+
|              [ Cerrar sesión ]           |
+------------------------------------------+
```

- Las paradas van en orden de secuencia, no de llegada.
- Una parada pendiente acepta un resultado. Una registrada es final.

## Pantalla 2: No entregado (dentro de la misma tarjeta)

```
| (2)  Calle Juan León Mera 1224           |
|      ¿Por qué no se entregó?            |
|      ( ) El cliente no quiso recibirlo  |
|      ( ) El cliente no estaba           |
|      ( ) Fuera de la ventana horaria    |
|      ( ) Producto dañado                |
|      ( ) Dirección errónea              |
|      ( ) Pedido duplicado               |
|      [ Confirmar no entregado ]  [Volver]|
```

- El motivo es de lista cerrada (ADR 0007). El repartidor no escribe texto libre.
- Sin motivo elegido, "Confirmar" queda deshabilitado.

## Estados de error

- Ruta no disponible (endpoint no existe o red caída): "El servicio de rutas aún no está disponible".
- Conflicto al registrar (la parada ya tiene resultado): se recarga la ruta.

## Pendientes fuera de este boceto

- Marcar recogido y "en camino": Sprint 5, con Tracking.
- Captura de GPS para registrar el resultado: requiere `expo-location`.
- Foto opcional: no incluida en la primera versión.
