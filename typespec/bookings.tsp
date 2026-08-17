import "@typespec/http";
import "./models.tsp";

using Http;

namespace CalendarBooking;

/** Слот уже занят другим бронированием (любого типа события). */
@error
model SlotAlreadyBookedError {
  @statusCode statusCode: 409;
  code: "slot_already_booked";
  message: string;
}

/** Выбранный слот вне окна записи (14 дней от текущей даты) или не существует. */
@error
model SlotNotAvailableError {
  @statusCode statusCode: 400;
  code: "slot_not_available";
  message: string;
}

@route("/bookings")
@tag("Bookings")
interface Bookings {
  /**
   * Страница предстоящих встреч владельца календаря: единый список
   * бронирований по всем типам событий.
   */
  @get listUpcoming(): BookingWithEventType[] | Error;

  /**
   * Создать бронирование на выбранный гостем слот.
   *
   * Правило занятости: на одно и то же время нельзя создать две записи,
   * даже если это разные типы событий. Слот должен принадлежать окну
   * записи по умолчанию — 14 дней от текущей даты.
   */
  @post create(@body body: BookingCreate):
    | {
        @statusCode statusCode: 201;
        @body booking: Booking;
      }
    | SlotAlreadyBookedError
    | SlotNotAvailableError
    | Error;
}
