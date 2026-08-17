# Backend — Calendar Booking Service

Реальный Spring Boot-бэкенд для Calendar Booking Service. Реализует API по
контракту из [`../typespec`](../typespec) (источник истины —
`../typespec/tsp-output/schema/openapi.yaml`), предоставляет те же 5 операций,
что и Prism-мок фронтенда, и заменяет его на порту **4010**.

## Требования и стек

- Java 25 (Temurin) — через sdkman, глобальный дефолт не менять.
- Spring Boot 4.1.x, Gradle wrapper (`./gradlew`), H2 (embedded), Spring Data JPA.
- `JAVA_HOME` должен указывать на JDK 25, иначе Gradle не разрешит toolchain:

```bash
export JAVA_HOME="$HOME/.sdkman/candidates/java/25.0.4-tem"
```

## Быстрый старт

```bash
cd ../backend
JAVA_HOME=… ./gradlew bootRun   # сервис на http://127.0.0.1:4010
```

По умолчанию H2 in-memory (`jdbc:h2:mem:booking`) — данные сбрасываются при
рестарте. Персистентность включается без правок кода:

```bash
DB_URL=jdbc:h2:file:./data/booking JAVA_HOME=… ./gradlew bootRun
```

Примечание: `npm run mock:api` (Prism) занимает тот же порт 4010 — не запускать
одновременно с бэкендом.

## Конфигурация (env)

| Переменная        | Дефолт            | Назначение                                       |
| ----------------- | ----------------- | ------------------------------------------------ |
| `PORT`            | `4010`            | Порт HTTP-сервера                                |
| `DB_URL`          | `jdbc:h2:mem:booking;DB_CLOSE_DELAY=-1` | JDBC URL H2 (in-memory по умолчанию)     |
| `SLOT_TIMEZONE`   | `Europe/Moscow`   | TZ генерации слотов                              |
| `SLOT_DAYS_AHEAD` | `14`              | Окно записи, дней                                |
| `SLOT_DAYS_OF_WEEK`| `1,2,3,4,5`      | Рабочие дни (1=Пн..7=Вс)                         |
| `SLOT_START_HOUR` | `9`               | Час первого старта                               |
| `SLOT_END_HOUR`   | `17`              | Час последнего старта (включительно)             |
| `SLOT_STEP_MIN`   | `60`              | Шаг стартов, минут                               |

Свободные слоты не хранятся — сетка пересчитывается на каждый запрос по этому
расписанию с исключением уже занятых стартов.

## API

Все операции соответствуют контракту `typespec`. Времена — ISO-8601 UTC
(суффикс `Z`).

| Метод | Путь | Успех | Коды ошибок |
| ----- | ---- | ----- | ----------- |
| GET    | `/event-types`                    | 200 `EventType[]` | — |
| GET    | `/event-types/{id}`                | 200 `EventType` | 404 `Error(code:404)` |
| POST   | `/event-types`                     | 201 `EventType` | 409 `Error(code:409)` дубликат id; 400 `Error(code:400)` невалидное тело |
| GET    | `/event-types/{eventTypeId}/slots` | 200 `AvailableSlot[]` (без занятых) | 404 `Error(code:404)` |
| GET    | `/bookings`                        | 200 `BookingWithEventType[]` | — |
| POST   | `/bookings`                        | 201 `Booking` | 409 `slot_already_booked`; 400 `slot_not_available`; 400 `Error(code:400)` невалидное тело |

## Быстрая проверка curl (против запущенного `bootRun`)

```bash
BASE=http://127.0.0.1:4010

# 1. Создать тип события -> 201
curl -i -X POST $BASE/event-types \
  -H 'Content-Type: application/json' \
  -d '{"id":"consultation","name":"Консультация","description":"30 минут беседы","durationMinutes":30}'

# 2. Список типов -> 200
curl -s $BASE/event-types

# 3. Чтение одного + несуществующий -> 200 / 404
curl -s $BASE/event-types/consultation
curl -s -o /dev/null -w '%{http_code}\n' $BASE/event-types/nope

# 4. Слоты (минимум 3 дня, включая день следующего месяца) -> 200
curl -s $BASE/event-types/consultation/slots

# 5. Создать бронь -> 201 (start берите первый слот из шага 4)
curl -s -X POST $BASE/bookings \
  -H 'Content-Type: application/json' \
  -d '{"eventTypeId":"consultation","start":"2026-08-10T12:00:00Z"}'

# 6. Повторный сабмит того же старта (даже другим типом) -> 409 slot_already_booked
curl -s -X POST $BASE/bookings \
  -H 'Content-Type: application/json' \
  -d '{"eventTypeId":"consultation","start":"2026-08-10T12:00:00Z"}'

# 7. Слоты пересчитаны (занятый старт исключён), список броней со встроенным типом
curl -s $BASE/event-types/consultation/slots
curl -s $BASE/bookings

# 8. Вне окна 14 суток -> 400 slot_not_available
curl -s -X POST $BASE/bookings \
  -H 'Content-Type: application/json' \
  -d '{"eventTypeId":"consultation","start":"2099-01-01T12:00:00Z"}'

# 9. Невалидное тело (bad id, long name) -> 400 Error(code:400)
curl -s -X POST $BASE/event-types \
  -H 'Content-Type: application/json' \
  -d '{"id":"BAD_ID","name":"X","description":"y","durationMinutes":1}'
```

## Тесты

```bash
JAVA_HOME=… ./gradlew build   # JUnit 5 + MockMvc + кон-тест на unique-слот
```