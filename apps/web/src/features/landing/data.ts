import { Cookie, Flower2, Gift, Headset, MapPin, Snowflake, type LucideIcon } from 'lucide-react'

/** Colecciones: categorías editoriales de la landing. No son datos del catálogo ni llevan cifras. */
export const COLLECTIONS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Flower2, title: 'Ramos y arreglos', text: 'Flores para regalar o decorar.' },
  { icon: Gift, title: 'Cajas de regalo', text: 'Combinaciones listas para dar.' },
  { icon: Cookie, title: 'Chocolates y galletas', text: 'Dulces para compartir o regalar.' },
]

/** Proceso de entrega. Claims a validar por el negocio: ver el cuerpo del commit. */
export const TRACKING_STEPS: { title: string; text: string }[] = [
  { title: 'Sellado en almacén', text: 'Tu pedido se prepara y se sella antes de salir.' },
  { title: 'Despacho en flota', text: 'Sale a ruta con la flota de reparto de Pikka.' },
  { title: 'Entrega con código PIN', text: 'La entrega se confirma con un código PIN al llegar.' },
]

/** Compromisos. Claims a validar por el negocio: ver el cuerpo del commit. */
export const COMMITMENTS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Snowflake,
    title: 'Empaque isotérmico',
    text: 'Empaque pensado para mantener tu pedido en buen estado durante el trayecto.',
  },
  {
    icon: MapPin,
    title: 'Seguimiento de tu pedido',
    text: 'Consulta el estado y la ruta de tu pedido desde tu cuenta.',
  },
  {
    icon: Headset,
    title: 'Atención de operadores',
    text: 'Si algo no sale bien, un operador revisa tu caso.',
  },
]
