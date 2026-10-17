import type { CatalogProduct } from './types'

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: 'pk-01',
    ref: 'REF: PK-01',
    title: 'Triple Chocolate Belga & Frutos Rojos',
    subtitle: 'Pastelería fina artesanal · 6 porciones',
    price: '$22.00',
    note: 'ELABORACIÓN DEL DÍA',
    rating: 4.95,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBKo3v-437kF6lknipvGbA1g8b9EGMOj3RoqY1iHBgHrPxImqeXs0p9akmvDfBKapKMDBsBFcKrAUqZ6QsycIhax8PW1R9QPAU34c7L7J_GJqILlpCNV8xSSgibol8Ar1aJhJvrvjTrYB91fO48oXzKPR2ubE9GxQxER_R6uZz_f36YMnuLkDiPKztZMj9D46MKHx3o5GeTKmYu8OnTvIUrVEwibSb0U-R2J52t4KHdZNACupIBR5Xi',
    category: 'pasteleria',
    accentColor: '#006b5f',
  },
  {
    id: 'pk-02',
    ref: 'REF: PK-02',
    title: 'Arreglo de globos con peluche',
    subtitle: 'Globos metalizados y peluche para regalo',
    price: '$30.00',
    note: 'LISTO PARA REGALO',
    rating: 4.88,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_OMKxuXkgm530CAnob7-Akb2GxTnoaQKqQEr0-FktriXtxhN8TObIlfPrUZPhw-PdMAD2RLc3G18dF0P6R4aleX9Gnuu1Acd1pvjHLYlx5aj5stc5BnIiw07iq65fHNRmlAHRN5NRFRR_FXEokiNuIwrylTJr_1hBYl4bvpcBAukzmjgW9YNjGV3L8UiWzSnTkqJsWSoyirPnjr2NPFffFWMZrdV1a8igT0tfsOvTu9Jjingf74Ag',
    category: 'regalos',
    accentColor: '#48dcc8',
  },
  {
    id: 'pk-03',
    ref: 'REF: PK-03',
    title: 'Arreglo floral en caja con dedicatoria',
    subtitle: 'Flores de temporada seleccionadas en caja de lujo',
    price: '$35.00',
    note: 'FLORISTERÍA FRESCA',
    rating: 4.97,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAYHnt3mMAXr4q0t8tfDLiBmpH5kQhr61ihsWty2qUmAPlYUf1cNJMwqUwplp0TPP59lIIRv9VZwMFNAa30-xOKdODRKR8y3C546Ol_JVYcCZS8LT9O6ZZ-E21e52cNEUbsdpbLGVd2uSmt3kxdlUKZTdwYD1Gc43Dl0TeKLiqKEmIZUSPfYQWBuvhkhgkGKzjwslkbkrRL2E92Gc7C8YJzYD-TyNW8US3DIDAT1Hz5cNaGm3GvHDEd',
    category: 'regalos',
    accentColor: '#004b4e',
  },
  {
    id: 'pk-04',
    ref: 'REF: PK-04',
    title: 'Caja de chocolates finos surtidos',
    subtitle: '16 piezas artesanales rellenas de autor',
    price: '$20.00',
    note: 'CHOCOLATERÍA DE AUTOR',
    rating: 4.92,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCMlpyqIKkibrC60X7IcAK5SPBl_atvL9tOpb0-bx7szfZLw3qt7mU2bRLdlRFXS0UI4d6uDdE3GdCxTewVUiPE0mZu6JJQ34B8kxaW9ClqVFvPnKgBeXLM_kq6w0jznBuZ2W583LEN2nh6r22vszPHsyWsXeM_o2tV40W8Oy9vEdGQYiXvooZXFYCgS3X948ehG_SaY70K_loq_PM4rl7V-l4Qq4Da4ybD33xpXK4iR-o0iz2PLcU_',
    category: 'pasteleria',
    accentColor: '#006b5f',
  },
  {
    id: 'pk-05',
    ref: 'REF: PK-05',
    title: 'Ramo de rosas rojas premium',
    subtitle: 'Docena de rosas seleccionadas con follaje fino',
    price: '$28.00',
    note: 'SELECCIÓN EXCLUSIVA',
    rating: 5.0,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAYHnt3mMAXr4q0t8tfDLiBmpH5kQhr61ihsWty2qUmAPlYUf1cNJMwqUwplp0TPP59lIIRv9VZwMFNAa30-xOKdODRKR8y3C546Ol_JVYcCZS8LT9O6ZZ-E21e52cNEUbsdpbLGVd2uSmt3kxdlUKZTdwYD1Gc43Dl0TeKLiqKEmIZUSPfYQWBuvhkhgkGKzjwslkbkrRL2E92Gc7C8YJzYD-TyNW8US3DIDAT1Hz5cNaGm3GvHDEd',
    category: 'regalos',
    accentColor: '#ba1a1a',
  },
]

export function getProductImage(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('globo')) {
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_OMKxuXkgm530CAnob7-Akb2GxTnoaQKqQEr0-FktriXtxhN8TObIlfPrUZPhw-PdMAD2RLc3G18dF0P6R4aleX9Gnuu1Acd1pvjHLYlx5aj5stc5BnIiw07iq65fHNRmlAHRN5NRFRR_FXEokiNuIwrylTJr_1hBYl4bvpcBAukzmjgW9YNjGV3L8UiWzSnTkqJsWSoyirPnjr2NPFffFWMZrdV1a8igT0tfsOvTu9Jjingf74Ag'
  }
  if (lower.includes('rosa') || lower.includes('floral') || lower.includes('flor') || lower.includes('girasol') || lower.includes('tulip')) {
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYHnt3mMAXr4q0t8tfDLiBmpH5kQhr61ihsWty2qUmAPlYUf1cNJMwqUwplp0TPP59lIIRv9VZwMFNAa30-xOKdODRKR8y3C546Ol_JVYcCZS8LT9O6ZZ-E21e52cNEUbsdpbLGVd2uSmt3kxdlUKZTdwYD1Gc43Dl0TeKLiqKEmIZUSPfYQWBuvhkhgkGKzjwslkbkrRL2E92Gc7C8YJzYD-TyNW8US3DIDAT1Hz5cNaGm3GvHDEd'
  }
  if (lower.includes('chocolate') || lower.includes('galleta') || lower.includes('tarta') || lower.includes('fruta')) {
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKo3v-437kF6lknipvGbA1g8b9EGMOj3RoqY1iHBgHrPxImqeXs0p9akmvDfBKapKMDBsBFcKrAUqZ6QsycIhax8PW1R9QPAU34c7L7J_GJqILlpCNV8xSSgibol8Ar1aJhJvrvjTrYB91fO48oXzKPR2ubE9GxQxER_R6uZz_f36YMnuLkDiPKztZMj9D46MKHx3o5GeTKmYu8OnTvIUrVEwibSb0U-R2J52t4KHdZNACupIBR5Xi'
  }
  return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMlpyqIKkibrC60X7IcAK5SPBl_atvL9tOpb0-bx7szfZLw3qt7mU2bRLdlRFXS0UI4d6uDdE3GdCxTewVUiPE0mZu6JJQ34B8kxaW9ClqVFvPnKgBeXLM_kq6w0jznBuZ2W583LEN2nh6r22vszPHsyWsXeM_o2tV40W8Oy9vEdGQYiXvooZXFYCgS3X948ehG_SaY70K_loq_PM4rl7V-l4Qq4Da4ybD33xpXK4iR-o0iz2PLcU_'
}

export const CATEGORY_FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'pasteleria', label: 'Pastelería' },
  { key: 'regalos', label: 'Regalos & Flores' },
  { key: 'audio', label: 'Tecnología' },
  { key: 'cafe', label: 'Cafetería' },
] as const
