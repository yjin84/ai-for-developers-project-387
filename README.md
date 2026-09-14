### Hexlet tests and linter status:

[![Actions Status](https://github.com/yjin84/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/yjin84/ai-for-developers-project-386/actions)

### Frontend build and tests:

[![Frontend](https://github.com/yjin84/ai-for-developers-project-386/actions/workflows/frontend.yml/badge.svg)](https://github.com/yjin84/ai-for-developers-project-386/actions/workflows/frontend.yml)

### Backend build and tests:

[![Backend](https://github.com/yjin84/ai-for-developers-project-386/actions/workflows/backend.yml/badge.svg)](https://github.com/yjin84/ai-for-developers-project-386/actions/workflows/backend.yml)

## Деплой

Приложение развёрнуто на Railway: <https://pleasant-art-production-18a0.up.railway.app>

Один контейнер «SPA + API»: Spring Boot раздаёт фронтенд и API на одном порту
(`PORT` назначает платформа). Сборка — многоступенчатый `Dockerfile` в корне
репозитория.

## Автоматизация на основе OpenCode

Репозиторий использует GitHub-агент OpenCode (`anomalyco/opencode/github@latest`,
модель `opencode/deepseek-v4-flash`). Все сценарии описаны в `.github/workflows/`:

| Сценарий | Workflow | Команда / триггер | Что делает агент | Где результат |
|---|---|---|---|---|
| Интерактивный вызов | `opencode.yml` | `/oc` или `/opencode` в комментарии к issue или строке PR | Работает с кодом, коммитит и пушит изменения | Комментарий и коммиты в той же ветке/PR |
| Авто-триаж issue | `opencode-triage.yml` | Новая issue от человека | Классифицирует (баг/фича/вопрос), ищет причину в коде, предлагает план | Комментарий-анализ в issue |
| Авто-ревью PR | `opencode-review.yml` | Открытие/возобновление PR | Изучает диф и контракт, ищет баги и проблемы стиля | Комментарий-ревью в PR |
| Регулярный анализ Lighthouse | `lighthouse.yml` (шаг `Analyze Lighthouse report with OpenCode`) | Ночное расписание (23:00 UTC) | Разбирает JSON-отчёты, при регрессии < 0.9 создаёт issue | Логи прогона, issue о регрессии |

Решения по конфигурации:

- **`share: false`** — сессии не публикуются на opencode.ai и не создают
  публичных ссылок на историю (репозиторий публичный). Публичные ссылки не нужны,
  прогоны и так видны в Actions.
- **`persist-credentials: false`** во всех checkout + явная настройка git-auth
  шагом `Configure git auth and identity` — агент получает доступ на запись
  только через `GITHUB_TOKEN` текущего прогона, а не через сохранённые креды.
- **Проверка автора**: `user.type == 'User'` исключает ботов и самого агента
  (`opencode-agent[bot]`) — это разрывает петлю «комментарий агента → новый
  прогон». PR-ревью не триггерится на `synchronize`, чтобы коммит по замечаниям
  не запускал ревью повторно.
- **`mentions` заданы явно** (`/oc,/opencode`) в каждом workflow — единый список
  команд вызова вместо значения по умолчанию.

Самооценка: сценарии покрывают жизненный цикл — входящая issue (`triage`),
ревью изменений (`review`), управляемый вызов (`/oc` в `opencode.yml`) и регулярный
контроль качества (`lighthouse`). Защита от циклов и минимум прав реализованы
на уровне самих workflows (проверка автора, persist-credentials, отсутствие
`id-token` там, где не нужен OIDC).
