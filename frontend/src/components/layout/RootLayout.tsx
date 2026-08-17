import { useEffect, useState } from 'react'
import { onlineManager } from '@tanstack/react-query'
import { Outlet } from 'react-router-dom'
import { isApiConfigured } from '@/api/config'
import { Toaster } from '@/components/ui/sonner'
import { messages } from '@/lib/messages'
import { cn } from '@/lib/utils'
import { Header } from './Header'

function Banner({ show, tone, text }: { show: boolean; tone: 'warning' | 'danger'; text: string }) {
  if (!show) return null
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        'border-b px-4 py-2 text-center text-sm font-medium',
        tone === 'warning'
          ? 'border-yellow-600/30 bg-yellow-500/15 text-yellow-800 dark:text-yellow-200'
          : 'border-destructive/30 bg-destructive/10 text-destructive',
      )}
    >
      {text}
    </p>
  )
}

export function RootLayout() {
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline())

  useEffect(() => {
    return onlineManager.subscribe((online) => setIsOnline(online))
  }, [])

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-3 focus:ring-ring/50"
      >
        {messages.common.skipToContent}
      </a>
      <Banner show={!isApiConfigured} tone="warning" text={messages.app.apiNotConfigured} />
      <Banner show={!isOnline} tone="danger" text={messages.app.offline} />
      <Header />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Toaster position="top-right" />
    </div>
  )
}
