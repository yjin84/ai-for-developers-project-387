import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { messages } from '@/lib/messages'

export function LandingPage() {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:items-start">
      <div className="flex flex-col gap-4">
        <Badge variant="secondary" className="w-fit uppercase">
          {messages.landing.badge}
        </Badge>
        <h1 className="font-heading text-4xl font-bold tracking-tight">{messages.landing.title}</h1>
        <p className="max-w-md text-muted-foreground">{messages.landing.subtitle}</p>
        <Button asChild size="lg" className="w-fit">
          <Link to="/book">
            {messages.landing.cta}
            <ArrowRight />
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{messages.landing.featuresTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            {messages.landing.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
