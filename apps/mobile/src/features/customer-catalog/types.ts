export interface CatalogProduct {
  id: string
  ref: string
  title: string
  subtitle: string
  price: string
  note: string
  rating: number
  imageUrl: string
  category: string
  accentColor?: string
}

export interface CuratedCollection {
  id: string
  number: string
  title: string
  subtitle: string
  icon: string
}

export type CatalogCategory = 'todos' | 'pasteleria' | 'regalos' | 'audio' | 'cafe'

export type CustomerTab = 'catalogo' | 'pedidos' | 'cuenta'
