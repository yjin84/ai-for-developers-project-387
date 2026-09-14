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
модель `opencode/big-pickle`). Все сценарии описаны в `.github/workflows/`:

| Сценарий | Workflow | Команда / триггер | Что делает агент | Где результат |
|---|---|---|---|---|
| Интерактивный вызов | `opencode.yml` | `/oc` или `/opencode` в комментарии к issue или строке PR | Работает с кодом, коммитит и пушит изменения | Комментарий и коммиты в той же ветке/PR |
| Авто-триаж issue | `opencode-triage.yml` | Новая issue от человека | Классифицирует (баг/фича/вопрос), ищет причину в коде, предлагает план | Комментарий-анализ в issue |
| Авто-ревью PR | `opencode-review.yml` | Открытие/возобновление PR | Изучает диф и контракт, ищет баги и проблемы стиля | Комментарий-ревью в PR |
| Регулярный анализ Lighthouse | `lighthouse.yml` (шаг `Analyze Lighthouse report with OpenCode`) | Ночное расписание (23:00 UTC) | Разбирает JSON-отчёты, при регрессии < 0.9 создаёт issue (или комментирует в существующую) | Логи прогона, issue о регрессии |

Решения по конфигурации:

- **`share: false`** — сессии не публикуются на opencode.ai и не создают
  публичных ссылок на историю (репозиторий публичный). Публичные ссылки не нужны,
  прогоны и так видны в Actions.
- **`persist-credentials: false`** во всех checkout. Для сценариев, где агенту нужно
  пушить (`opencode.yml`, `opencode-triage.yml`, `opencode-review.yml`), авторизация
  настраивается явно шагом `Configure git auth and identity` через `GITHUB_TOKEN`
  текущего прогона (агент не полагается на неявные креды с раннера). В `lighthouse.yml`
  write-доступ не нужен вовсе — агент там не коммитит, поэтому креды не настраиваются.
- **Проверка автора**: `user.type == 'User'` + `author_association`
  (OWNER/MEMBER/COLLABORATOR) — исключает ботов и самого агента
  (`opencode-agent[bot]`), это разрывает петлю «комментарий агента → новый прогон».
  PR-ревью не триггерится на `synchronize`, чтобы коммит по замечаниям не запускал
  ревью повторно. Команда `/oc`/`/opencode` ловится и на отдельной строке комментария
  (после переноса строки).
- **`mentions` заданы явно** (`/oc,/opencode`) в каждом workflow — единый список
  команд вызова вместо значения по умолчанию.
- **Защита от дублей**: промпт Lighthouse сначала проверяет через `gh issue list`,
  нет ли уже открытой issue «Lighthouse: регрессия», и лишь потом создаёт новую.

Самооценка: сценарии покрывают жизненный цикл — входящая issue (`triage`),
ревью изменений (`review`), управляемый вызов (`/oc` в `opencode.yml`) и регулярный
контроль качества (`lighthouse`). Защита от циклов и минимум прав реализованы
на уровне самих workflows (проверка автора, persist-credentials, отсутствие
`id-token` там, где не нужен OIDC).

## Почему workflow правит человек

Файлы `.github/workflows/*` меняет только человек: токен прогона
(`GITHUB_TOKEN`) и агент OpenCode не имеют права их редактировать (ограничение
скоупа — GitHub App без права `workflows`). Агент может работать с кодом
и документацией в ветке, но изменение самих workflow выполняется вручную
через обычный PR от человека.
