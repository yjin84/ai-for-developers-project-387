import "@typespec/http";
import "./models.tsp";

using Http;

namespace CalendarBooking;

/**
 * Типы событий (виды брони).
 *
 * В системе нет регистрации и авторизации: владелец календаря — единственный
 * заранее заданный профиль, который по умолчанию используется в админской части.
 * Поэтому операции владельца не требуют дополнительной идентификации пользователя.
 */
@route("/event-types")
@tag("EventTypes")
interface EventTypes {
  /**
   * Список типов событий (страница с видами брони для гостя: название,
   * описание, длительность; используется также владельцем календаря).
   */
  @get list(): EventType[] | Error;

  /** Получить один тип события по идентификатору. */
  @get read(@path id: EventTypeId): EventType | Error;

  /**
   * Создать тип события. Доступно владельцу календаря: он сам задаёт id,
   * название, описание и длительность в минутах.
   */
  @post create(@body body: EventTypeCreate):
    | {
        @statusCode statusCode: 201;
        @body eventType: EventType;
      }
    | Error;
}
