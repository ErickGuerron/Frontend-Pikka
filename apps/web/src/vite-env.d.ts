/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** "true" swaps the customer orders API for an in-memory demo (default: off). */
  readonly VITE_MOCK_CUSTOMER_ORDERS?: string
  /** "true" swaps the drivers list for an in-memory demo (default: off). */
  readonly VITE_MOCK_DRIVERS?: string
  /** "true" swaps route generation for an in-memory demo (default: off). */
  readonly VITE_MOCK_ROUTING?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
