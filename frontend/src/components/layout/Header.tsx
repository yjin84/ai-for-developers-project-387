import { CalendarClock } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { messages } from '@/lib/messages'
import { cn } from '@/lib/utils'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-sm text-muted-foreground transition-colors hover:text-foreground',
    isActive && 'font-medium text-foreground',
  )

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <NavLink to="/" className="flex items-center gap-2 font-heading font-semibold">
          <CalendarClock className="size-5 shrink-0 text-primary" />
          <span className="hidden sm:inline">{messages.app.brand}</span>
        </NavLink>
        <nav className="flex items-center gap-6">
          <NavLink to="/book" className={navLinkClassName}>
            {messages.nav.book}
          </NavLink>
          <NavLink to="/admin" className={navLinkClassName}>
            {messages.nav.admin}
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
