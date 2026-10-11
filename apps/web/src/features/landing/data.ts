import {
  CalendarDays,
  Headset,
  Route,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export const STEPS = [
  {
    title: '1. Crea tu pedido',
    text: 'Regístrate, indica tu dirección, la fecha y tu ventana de entrega, y agrega notas si las necesitas.',
  },
  {
    title: '2. Lo validamos',
    text: 'Revisamos zona, fecha y capacidad. Si algo requiere atención, un operador lo revisa por ti.',
  },
  {
    title: '3. Síguelo y recíbelo',
    text: 'Consulta el estado y la ruta en el mapa hasta que tu pedido llega a tu puerta.',
  },
]

export const BENEFITS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: CalendarDays,
    title: 'Ventanas de entrega claras',
    text: 'Elige entre cuatro franjas horarias para recibir tu pedido.',
  },
  {
    icon: Route,
    title: 'Seguimiento de tu pedido',
    text: 'Consulta el estado y la ruta en el mapa desde tu cuenta.',
  },
  {
    icon: ShieldCheck,
    title: 'Validación automática',
    text: 'Revisamos zona, fecha y capacidad al crear tu pedido.',
  },
  {
    icon: Headset,
    title: 'Atención de operadores',
    text: 'Si hay un problema con tu pedido, un operador lo revisa.',
  },
]

/** Illustrative examples only: no real customers, no metrics. */
export const TESTIMONIALS = [
  {
    id: 'ventana',
    quote: 'Elegí mi ventana de entrega al crear el pedido y seguí la ruta en el mapa hasta que llegó.',
  },
  {
    id: 'cancelar',
    quote: 'Cambié de planes y pude cancelar mi pedido porque todavía no había salido a recogida.',
  },
  {
    id: 'excepcion',
    quote: 'Mi pedido tuvo un inconveniente con la dirección y un operador lo revisó hasta resolverlo.',
  },
]

export const ZONES = [
  { title: 'Zonas urbanas', text: 'Cobertura en áreas céntricas y residenciales con rutas de entrega rápida.' },
  { title: 'Zonas comerciales', text: 'Oficinas, plazas y corredores de negocios con atención prioritaria.' },
  { title: 'Zonas en expansión', text: 'Ampliamos la cobertura de forma continua hacia nuevas colonias.' },
]

export const FAQS = [
  {
    q: '¿Cómo hago un pedido?',
    a: 'Crea tu cuenta o inicia sesión, indica la dirección, la fecha y la ventana de entrega, agrega notas si lo necesitas y confirma tu pedido.',
  },
  {
    q: '¿En qué horario me entregan?',
    a: 'Eliges una de cuatro ventanas: 09–12, 12–15, 15–18 o 18–21, sujeta a la capacidad disponible para esa fecha.',
  },
  {
    q: '¿Puedo rastrear mi pedido?',
    a: 'Sí. Puedes consultar el estado de tu pedido y su ruta en el mapa desde tu cuenta.',
  },
  {
    q: '¿Puedo cancelar mi pedido?',
    a: 'Sí, mientras no haya salido a recogida. Después de ese momento ya no es posible cancelarlo.',
  },
  {
    q: '¿Qué hago si hay un problema con mi pedido?',
    a: 'Un operador revisa los pedidos con problemas y, si hace falta, puedes abrir una disputa desde tu cuenta dentro del plazo disponible.',
  },
]
