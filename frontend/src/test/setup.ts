import { afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// `globals: false` — `cleanup` сам по матчерам не очищается, вызываем явно.
afterEach(() => {
  cleanup()
})

// --- Полифиллы jsdom ----------------------------------------------
// jsdom не реализует `matchMedia` (нужен `BookSlotPage.selectDay` для
// проверки брейкпоинта), `scrollIntoView` и `requestAnimationFrame`.
beforeAll(() => {
  if (typeof window !== 'undefined') {
    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      })
    }

    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => {}
    }

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (cb: FrameRequestCallback) => {
        return window.setTimeout(cb, 0) as unknown as number
      }
      window.cancelAnimationFrame = (id: number) => window.clearTimeout(id)
    }
  }
})
