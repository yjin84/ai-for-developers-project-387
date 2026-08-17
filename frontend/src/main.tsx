import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/api/queryClient'
import './index.css'
import App from './App.tsx'

/**
 * В E2E-сборке (`VITE_ENABLE_MSW === 'true'`) до первого рендера стартует
 * MSW-воркер: только он может перехватывать fetch до того, как приложение
 * пошлёт запросы. В прод-сборке флаг ложный — воркер не загружается.
 */
async function bootstrap(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MSW === 'true') {
    const { startMockWorker } = await import('./test/browser')
    await startMockWorker()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void bootstrap()
