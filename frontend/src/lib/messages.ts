/**
 * Единая точка всех видимых пользователю текстов (RU).
 *
 * Компоненты и страницы не содержат строковых литералов — только ссылки
 * на этот объект. Так текст можно поменять в одном месте, а при появлении
 * второго языка — заменить модуль на настоящую i18n-библиотеку, не трогая
 * разметку.
 *
 * Форматирование дат и времени сюда **не** переносится: оно зависит от
 * локали `date-fns` и живёт в `src/lib/datetime.ts`.
 */
export const messages = {
  app: {
    title: 'Calendar — запись на встречу',
    brand: 'Calendar',
    apiNotConfigured: 'API не настроен: задайте VITE_API_BASE_URL в .env и перезапустите сервер.',
    offline: 'Нет подключения к интернету. Данные могут быть неактуальными.',
  },

  common: {
    back: 'Назад',
    retry: 'Повторить',
    confirm: 'Подтвердить',
    cancel: 'Отмена',
    create: 'Создать',
    creating: 'Создаём…',
    loading: 'Загрузка…',
    home: 'На главную',
    minutesShort: '{n} мин',
    skipToContent: 'К основному содержимому',
  },

  nav: {
    book: 'Записаться',
    admin: 'Админка',
  },

  landing: {
    badge: 'Быстрая запись на звонок',
    title: 'Calendar',
    subtitle: 'Забронируйте встречу за минуту: выберите тип события и удобное время.',
    cta: 'Записаться',
    featuresTitle: 'Возможности',
    features: [
      'Выбор типа события и удобного времени для встречи.',
      'Быстрое бронирование с подтверждением и дополнительными заметками.',
      'Управление типами встреч и просмотр предстоящих записей в админке.',
    ],
  },

  booking: {
    eventTypesTitle: 'Выберите тип события',
    eventTypesSubtitle: 'Нажмите на карточку, чтобы открыть календарь и выбрать удобный слот.',
    eventTypesEmptyTitle: 'Пока нет ни одного типа события',
    eventTypesEmptyDescription: 'Владелец календаря ещё не добавил типы событий для записи.',

    calendarTitle: 'Календарь',
    prevMonth: 'Предыдущий месяц',
    nextMonth: 'Следующий месяц',
    weekdays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],

    selectedDateLabel: 'Выбранная дата',
    selectedDateEmpty: 'Дата не выбрана',
    selectedTimeLabel: 'Выбранное время',
    selectedTimeEmpty: 'Время не выбрано',

    slotsTitle: 'Свободное время',
    slotsGroupLabel: 'Свободное время на {date}',
    slotOptionLabel: '{date}, {time}',
    slotsPickDayTitle: 'Выберите день',
    slotsPickDayDescription: 'Свободное время появится здесь после выбора дня в календаре.',
    slotsEmptyTitle: 'Нет свободных слотов',
    slotsEmptyDescription: 'На ближайшие 14 дней для этого типа события нет свободного времени.',

    submitting: 'Бронируем…',

    confirmedTitle: 'Встреча забронирована',
    confirmedAgain: 'Записаться ещё раз',
    confirmedToast: 'Встреча забронирована',
  },

  admin: {
    title: 'Админка',
    tabEventTypes: 'Типы событий',
    tabBookings: 'Предстоящие встречи',

    eventTypesHint: 'Типы событий, доступные гостям на странице записи.',
    eventTypesEmptyTitle: 'Пока нет ни одного типа события',
    eventTypesEmptyDescription:
      'Создайте первый тип события — он сразу появится на странице записи.',
    eventTypesTable: {
      name: 'Название',
      id: 'Идентификатор',
      description: 'Описание',
      duration: 'Длительность',
    },

    bookingsHint: 'Встречи, забронированные гостями, — ближайшие сверху.',
    bookingsEmptyTitle: 'Предстоящих встреч нет',
    bookingsEmptyDescription: 'Как только гость забронирует слот, встреча появится в этом списке.',
    bookingsTable: {
      eventType: 'Тип события',
      date: 'Дата',
      time: 'Время',
      duration: 'Длительность',
      createdAt: 'Забронировано',
    },

    createDialog: {
      trigger: 'Новый тип события',
      title: 'Новый тип события',
      description:
        'Гости увидят этот тип события на странице записи и смогут выбрать для него слот.',
      createdToast: 'Тип события «{name}» создан',
    },
    form: {
      idLabel: 'Идентификатор',
      idPlaceholder: 'meeting-15',
      idHint: 'Используется в ссылке на страницу записи.',
      nameLabel: 'Название',
      namePlaceholder: 'Встреча 15 минут',
      descriptionLabel: 'Описание',
      descriptionPlaceholder: 'Короткий тип события для быстрого слота.',
      durationLabel: 'Длительность, мин',
      durationPlaceholder: '15',
    },
  },

  notFound: {
    title: 'Страница не найдена',
    description: 'Проверьте адрес или вернитесь на главную.',
  },

  states: {
    errorTitle: 'Не удалось загрузить данные',
    errorDescription: 'Проверьте подключение и попробуйте снова.',
  },

  errors: {
    loadEventTypes: 'Не удалось загрузить список типов событий.',
    loadEventType: 'Не удалось загрузить тип события.',
    loadSlots: 'Не удалось загрузить свободные слоты.',
    loadBookings: 'Не удалось загрузить список предстоящих встреч.',
    createEventType: 'Не удалось создать тип события.',
    createBooking: 'Не удалось создать бронирование.',

    networkTitle: 'Нет связи с сервером',
    networkDescription: 'Проверьте подключение к интернету и попробуйте снова.',
    timeoutTitle: 'Сервер не отвечает',
    timeoutDescription: 'Время ожидания ответа истекло. Проверьте соединение и попробуйте снова.',
    slotAlreadyBookedTitle: 'Слот уже занят',
    slotAlreadyBookedDescription: 'Кто-то успел забронировать это время. Выберите другой слот.',
    slotNotAvailableTitle: 'Слот недоступен',
    slotNotAvailableDescription: 'Это время больше не доступно для записи. Выберите другое время.',
    notFoundTitle: 'Данные не найдены',
    notFoundDescription: 'Запрошенный ресурс не существует или был удалён.',
    serverTitle: 'Ошибка на сервере',
    serverDescription: 'Сервер не смог обработать запрос. Попробуйте позже.',
    unknownTitle: 'Что-то пошло не так',
    unknownDescription: 'Повторите попытку, а если ошибка сохраняется — обновите страницу.',
  },

  validation: {
    idRequired: 'Укажите идентификатор.',
    idPattern: 'Только строчные латинские буквы, цифры и дефис, например consultation-30.',
    idDuplicate: 'Тип события с таким идентификатором уже существует.',
    idMaxLength: 'Не длиннее {max} символов.',
    nameRequired: 'Укажите название.',
    nameMaxLength: 'Не длиннее {max} символов.',
    descriptionRequired: 'Укажите описание.',
    descriptionMaxLength: 'Не длиннее {max} символов.',
    durationRequired: 'Укажите длительность.',
    durationInteger: 'Длительность — целое число минут.',
    durationRange: 'Длительность — от {min} до {max} минут.',
  },
} as const

/**
 * Подстановка именованных параметров вида `{name}` в шаблон:
 * `format(messages.common.minutesShort, { n: 15 })` → `15 мин`.
 */
export function format(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  )
}

/**
 * Русские формы множественного числа: `plural(2, ['встреча', 'встречи', 'встреч'])`.
 *
 * Порядок форм — как у `Intl.PluralRules` для ru (`one`, `few`, `many`),
 * чтобы при переходе на него сигнатура не менялась.
 */
export function plural(count: number, forms: readonly [string, string, string]): string {
  const abs = Math.abs(count) % 100
  const tens = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (tens > 1 && tens < 5) return forms[1]
  if (tens === 1) return forms[0]
  return forms[2]
}
