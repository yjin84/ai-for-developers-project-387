import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/states'
import { messages } from '@/lib/messages'

export function NotFoundPage() {
  return (
    <EmptyState
      asHeading
      icon={Compass}
      title={messages.notFound.title}
      description={messages.notFound.description}
      action={
        <Button asChild size="sm">
          <Link to="/">{messages.common.home}</Link>
        </Button>
      }
    />
  )
}
