# Frontend — Calendar Booking Service

Отдельное SPA-приложение (Vite + React + TypeScript), которое общается с бэкендом
только через HTTP API, описанный в `../typespec`. Бэкенд может быть запущен
отдельно (адрес задаётся через `VITE_API_BASE_URL`) либо заменён локальным
мок-сервером на базе OpenAPI-спецификации.

Архитектурные решения и поэтапный план реализации — в [`docs/PLAN.md`](./docs/PLAN.md).

## Стек

- Vite + React + TypeScript (strict)
- Tailwind CSS + shadcn/ui (radix-nova)
- React Router, TanStack Query, react-hook-form + zod
- oxlint (линт) + prettier (форматирование)
- Prism — мок-сервер API по контракту, для разработки без реального бэкенда

## Быстрый старт

```bash
npm install
cp .env.example .env   # при необходимости поправить VITE_API_BASE_URL

# Вариант A: работать с мок-сервером (без бэкенда)
npm run mock:api        # поднимет мок на http://127.0.0.1:4010 по ../typespec/tsp-output/schema/openapi.yaml
npm run dev              # в другом терминале

# Вариант B: работать с реальным бэкендом
# в .env уже VITE_API_BASE_URL=http://127.0.0.1:4010 (совпадает с дефолтным
# портом бэкенда backend/), затем запустите bootRun (см. backend/README.md)
npm run dev
```

Порт 4010 занимает либо бэкенд, либо `npm run mock:api` — не запускайте их
параллельно (конфликт порта). Vite подхватывает базовый адрес из `.env` на
старте один раз — после смены `.env` перезапустите dev-сервер, иначе останется
старое запечённое значение.

## Скрипты

| Скрипт                            | Назначение                                                    |
| --------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                     | dev-сервер Vite                                               |
| `npm run build`                   | typecheck + продакшн-сборка                                   |
| `npm run preview`                 | превью собранного билда                                       |
| `npm run typecheck`               | проверка типов без сборки                                     |
| `npm run lint`                    | oxlint                                                        |
| `npm run format` / `format:check` | prettier                                                      |
| `npm run mock:api`                | Prism-мок API из `../typespec/tsp-output/schema/openapi.yaml` |
| `npm run test`                    | unit/component тесты (Vitest + RTL)                           |
| `npm run test:coverage`           | unit-тесты + проверка порогов покрытия                        |
| `npm run test:e2e`                | E2E против MSW-мока (Playwright, desktop/mobile)              |
| `npm run test:e2e:smoke`          | smoke против Prism (по контракту из `../typespec`)            |

## Тестирование

| Уровень              | Инструмент         | Что покрывает                                                           |
| -------------------- | ------------------ | ----------------------------------------------------------------------- |
| unit/компонент       | Vitest + RTL + MSW | контракт API, слой клиента, формы, страницы — ключевые модули 100%      |
| E2E (desktop/mobile) | Playwright         | сценарии гостя, админа, адаптивность, a11y, сбои сети — против MSW-мока |
| smoke                | Playwright + Prism | приложение без MSW против реального `openapi.yaml` из `../typespec`     |

Прогон всех проверок CI:

```bash
npm run typecheck && npm run lint && npm run format:check
npm run test:coverage
npm run test:e2e
npm run test:e2e:smoke
```

Перед smoke сгенерируйте контракт (в репозиторий он не коммитится), обычно это
делает CI, но локально: `cd ../typespec && npx tsp compile .`.

## Компоненты UI

Компоненты shadcn/ui добавляются командой:

```bash
npx shadcn@latest add <component>
```

Файлы попадают в `src/components/ui` (алиас `@/*` → `./src/*`, настроен в
`tsconfig.json`/`tsconfig.app.json` и `vite.config.ts`).
