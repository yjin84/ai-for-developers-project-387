import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import * as eventTypes from '@/api/eventTypes'
import { queryKeys } from '@/api/queryKeys'
import { EventTypeForm } from '@/components/admin/EventTypeForm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { describeError } from '@/lib/errorMessages'
import { format, messages } from '@/lib/messages'

/**
 * Кнопка «Новый тип события» с диалогом создания.
 *
 * Контент диалога размонтируется при закрытии, поэтому форма каждый раз
 * открывается пустой — отдельный сброс состояния не нужен.
 */
export function EventTypeCreateDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: eventTypes.create,
    onSuccess: async (eventType) => {
      toast.success(format(messages.admin.createDialog.createdToast, { name: eventType.name }))
      setOpen(false)
      // Список типов событий показывается и в админке, и в гостевом флоу —
      // инвалидируем всю ветку, чтобы новый тип сразу был виден на обоих экранах.
      await queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes.all })
    },
    onError: (error: unknown) => {
      // Тост дублирует сообщение, которое форма показывает в поле или над
      // кнопками, — на случай, если фокус пользователя не на диалоге.
      toast.error(describeError(error, messages.errors.createEventType).description)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          {messages.admin.createDialog.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{messages.admin.createDialog.title}</DialogTitle>
          <DialogDescription>{messages.admin.createDialog.description}</DialogDescription>
        </DialogHeader>
        <EventTypeForm
          onSubmit={async (values) => {
            await createMutation.mutateAsync(values)
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
