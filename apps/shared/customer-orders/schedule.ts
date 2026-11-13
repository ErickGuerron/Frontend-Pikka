export function scheduledOrderNotice(date: string, window: string): string {
  return `Pedido programado para entregarse el ${date} entre ${window}. Lo asignaremos a un repartidor de tu zona ese día.`
}
