import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { describeError } from '@/lib/errorMessages'
import { messages } from '@/lib/messages'
import {
  eventTypeCreateSchema,
  type EventTypeCreateFormValues,
  type EventTypeCreateValues,
} from '@/lib/validation/eventType'

const EMPTY_VALUES: EventTypeCreateFormValues = {
  id: '',
  name: '',
  description: '',
  durationMinutes: '',
}

type EventTypeFormProps = {
  /** Отправка формы. Отклонённый промис превращается в ошибку поля или формы. */
  onSubmit: (values: EventTypeCreateValues) => Promise<void>
  onCancel: () => void
}

/**
 * Форма создания типа события (`POST /event-types`).
 *
 * Валидация — zod-схема, зеркалящая модель `EventTypeCreate` контракта.
 * Ошибку сервера форма разбирает сама: конфликт идентификатора (409)
 * показывается под полем `id`, остальные — общей ошибкой над кнопками.
 * Введённые данные при ошибке сохраняются.
 */
export function EventTypeForm({ onSubmit, onCancel }: EventTypeFormProps) {
  const form = useForm<EventTypeCreateFormValues, unknown, EventTypeCreateValues>({
    resolver: zodResolver(eventTypeCreateSchema),
    defaultValues: EMPTY_VALUES,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  const rootError = form.formState.errors.root?.message
  const isSubmitting = form.formState.isSubmitting

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        form.setError('id', { message: error.message || messages.validation.idDuplicate })
        form.setFocus('id')
        return
      }
      form.setError('root', {
        message: describeError(error, messages.errors.createEventType).description,
      })
    }
  })

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{messages.admin.form.idLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={messages.admin.form.idPlaceholder}
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormDescription>{messages.admin.form.idHint}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{messages.admin.form.nameLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={messages.admin.form.namePlaceholder}
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{messages.admin.form.descriptionLabel}</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder={messages.admin.form.descriptionPlaceholder}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="durationMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{messages.admin.form.durationLabel}</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  placeholder={messages.admin.form.durationPlaceholder}
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {rootError ? (
          <p role="alert" className="text-sm text-destructive">
            {rootError}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {messages.common.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? messages.common.creating : messages.common.create}
          </Button>
        </div>
      </form>
    </Form>
  )
}
