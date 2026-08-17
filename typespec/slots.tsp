import "@typespec/http";
import "./models.tsp";

using Http;

namespace CalendarBooking;

/**
 * Календарь свободных слотов для конкретного типа события.
 *
 * Слоты формируются на 14 дней вперёд от текущей даты — это окно записи
 * по умолчанию. Гость может выбрать только свободный слот из этого окна.
 */
@route("/event-types/{eventTypeId}/slots")
@tag("Slots")
interface Slots {
  /**
   * Список свободных слотов выбранного типа события на ближайшие 14 дней.
   * Слоты, уже занятые бронированием любого типа события, в списке не
   * возвращаются — на одно и то же время не может быть двух записей.
   */
  @get list(@path eventTypeId: EventTypeId): AvailableSlot[] | Error;
}
