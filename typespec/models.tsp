import "@typespec/http";

using Http;

namespace CalendarBooking;

/**
 * Идентификатор типа события — kebab-case из латиницы и цифр,
 * например "consultation-30".
 *
 * Формат ограничен, потому что идентификатор подставляется в пути
 * `/event-types/{id}` и `/event-types/{id}/slots`, а также в адрес страницы
 * записи в клиентском приложении — ссылка должна оставаться читаемой
 * и не требовать процентного кодирования.
 */
@minLength(1)
@maxLength(64)
@pattern("^[a-z0-9]+(-[a-z0-9]+)*$")
scalar EventTypeId extends string;

/**
 * Тип события, который создаёт владелец календаря.
 * Гости используют его, чтобы понять, на что они записываются,
 * и чтобы выбрать календарь для бронирования.
 */
model EventType {
  /** Идентификатор задаётся владельцем календаря при создании. */
  id: EventTypeId;

  /** Название типа события, например "Консультация". */
  @minLength(1)
  @maxLength(100)
  name: string;

  /** Описание того, что будет происходить на встрече. */
  @minLength(1)
  @maxLength(500)
  description: string;

  /** Длительность встречи в минутах: от 5 минут до 8 часов. */
  @minValue(5)
  @maxValue(480)
  durationMinutes: int32;
}

/** Тело запроса на создание типа события владельцем календаря. */
model EventTypeCreate {
  /** Идентификатор нового типа события, задаётся владельцем. */
  id: EventTypeId;

  @minLength(1)
  @maxLength(100)
  name: string;

  @minLength(1)
  @maxLength(500)
  description: string;

  @minValue(5)
  @maxValue(480)
  durationMinutes: int32;
}

/**
 * Свободный слот в календаре выбранного типа события.
 * Слоты рассчитываются на 14 дней вперёд от текущей даты.
 */
model AvailableSlot {
  /** Начало слота. */
  start: utcDateTime;

  /** Конец слота: start + durationMinutes выбранного типа события. */
  end: utcDateTime;
}

/** Бронирование, созданное гостем на свободный слот. */
model Booking {
  id: string;

  /** Тип события, на который сделано бронирование. */
  eventTypeId: EventTypeId;

  /** Начало забронированного слота. */
  start: utcDateTime;

  /** Конец забронированного слота (вычисляется по длительности типа события). */
  end: utcDateTime;

  /** Момент создания бронирования. */
  createdAt: utcDateTime;
}

/** Тело запроса на создание бронирования гостем. */
model BookingCreate {
  /** Идентификатор выбранного типа события. */
  eventTypeId: EventTypeId;

  /** Начало выбранного гостем слота. */
  start: utcDateTime;
}

/**
 * Бронирование вместе с данными о типе события — используется на странице
 * владельца календаря со списком всех предстоящих встреч.
 */
model BookingWithEventType {
  id: string;
  eventType: EventType;
  start: utcDateTime;
  end: utcDateTime;
  createdAt: utcDateTime;
}

@error
model Error {
  code: int32;
  message: string;
}
