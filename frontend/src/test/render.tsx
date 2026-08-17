import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { routes } from '@/router'

/**
 * Свежий QueryClient на каждый тест: выключен retry (ошибка должна сразу
 * попасть в тест, а не ретраиться) и gcTime (нет фоновой сборки мусора,
 * которая флакила бы ассерты между тестами).
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

/**
 * Рендер произвольного компонента с провайдерами (QueryClient + router +
 * Toaster) и готовым `userEvent`.
 *
 * Тосты сыну требуют `<Toaster />` в DOM, иначе их нельзя проверить.
 */
export function renderWithProviders(ui: React.ReactElement, route = '/') {
  const queryClient = createTestQueryClient()
  const user = userEvent.setup()

  const screen = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>,
  )

  return { ...screen, user, queryClient }
}

/** Рендер реального дерева маршрутов по пути — для страничных тестов. */
export function renderRoute(path: string) {
  const queryClient = createTestQueryClient()
  const user = userEvent.setup()
  const router = createMemoryRouter(routes, { initialEntries: [path] })

  const screen = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </QueryClientProvider>,
  )

  return { ...screen, user, queryClient }
}
