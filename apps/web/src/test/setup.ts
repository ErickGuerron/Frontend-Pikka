import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { revealConfig } from '@/features/routing/reveal'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

// The route plan reveal is animated in the app; tests see the whole plan at once unless they opt in.
revealConfig.delayMs = 0

// jsdom does not implement scrollIntoView.
Element.prototype.scrollIntoView = vi.fn()
