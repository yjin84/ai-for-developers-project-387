import { EventTypesTab } from '@/components/admin/EventTypesTab'
import { UpcomingBookingsTab } from '@/components/admin/UpcomingBookingsTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { messages } from '@/lib/messages'

export function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold">{messages.admin.title}</h1>
      <Tabs defaultValue="event-types">
        <TabsList>
          <TabsTrigger value="event-types">{messages.admin.tabEventTypes}</TabsTrigger>
          <TabsTrigger value="bookings">{messages.admin.tabBookings}</TabsTrigger>
        </TabsList>
        <TabsContent value="event-types" className="pt-4">
          <EventTypesTab />
        </TabsContent>
        <TabsContent value="bookings" className="pt-4">
          <UpcomingBookingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
