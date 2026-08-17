# AGENTS.md

## Repository layout

Monorepo for a Calendar Booking Service: a real Spring Boot backend + a Vite React SPA. Everything is contract-driven by `typespec/`.

- `backend/` — real API: Spring Boot 4.1 (JDK 25, Temurin), Gradle wrapper, H2 in-memory, port **4010**. This is the terminal backend — Prism is only used for smoke tests now.
- `frontend/` — Vite + React + TypeScript (strict) SPA. All logic and tests live here; all frontend commands below run from `frontend/`.
- `typespec/` — the API contract (`*.tsp`). Source of truth for the API.
- `ui-prototype/*.png` — reference design screenshots.
- `frontend/docs/PLAN.md` — record of architecture decisions and implementation details; read the relevant stage before changing code.

### Starting the backend

```bash
cd backend
JAVA_HOME=/home/eugene/.sdkman/candidates/java/25.0.4-tem ./gradlew bootRun   # serve on :4010
JAVA_HOME=/home/eugene/.sdkman/candidates/java/25.0.4-tem ./gradlew build     # compile + tests
```

- `JAVA_HOME` must point at the sdkman JDK 25 or Gradle will fail to resolve the toolchain. Port default `4010` matches `frontend/.env` `VITE_API_BASE_URL`.
- H2 is **in-memory by default** (`jdbc:h2:mem:booking`): data is wiped on restart. Persist via `DB_URL=jdbc:h2:file:./data/booking`.
- Slot schedule is env-configurable through `SLOT_*` (`SLOT_DAYS_AHEAD=14`, weekdays default `1,2,3,4,5`, start 09:00–17:00, step 60, `SLOT_TIMEZONE=Europe/Moscow`). Slot times are never stored — recomputed per request.
- Slot occupancy is enforced by a **unique index on `bookings.start`** — booking a slot already taken by *any* event type returns 409 `slot_already_booked` (see `BookingService`).
- `npm run mock:api` (Prism) binds the same `:4010` — never run it while the backend is up (port conflict); the backend replaces Prism.

### Backend verification / API contract

Backend implements all 5 contract operations on `:4010`. Contract is the single source of truth — the backend must stay aligned with `/event-types`, `/slots`, `/bookings`, CORS (`origin *`) and the error bodies (`Error`, `SlotAlreadyBookedError`, `SlotNotAvailableError`). Quick manual check via curl against `:4010` (see `planA.md` §4 for the full status matrix); wrong validation or messages are backend bugs, not frontend ones.

## Contract-driven API (critical workflow)

The API types and both client/server sides follow the contract, never written by hand:

1. Edit `typespec/*.tsp` (source of truth).
2. `cd ../typespec && npx tsp compile .` → writes `typespec/tsp-output/schema/openapi.yaml` (gitignored, not committed).
3. `npm run generate:api` → regenerates `frontend/src/api/schema.d.ts` (committed). It is excluded from Prettier via `.prettierignore`.

Gotchas:
- Smoke tests (`npm run test:e2e:smoke`) and `npm run mock:api` need the compiled `openapi.yaml`; it must be regenerated locally if missing.
- CI fails unless the committed `schema.d.ts` matches a fresh `generate:api` (`git diff --exit-code`). The backend is contract-aligned via `planA.md`; a contract change must land in both `typespec/` and `backend/` manually.
- `schema.d.ts` loses contract constraints (pattern, minLength) — openapi-typescript doesn't encode them. Client-side zod in `src/lib/validation/eventType.ts` mirrors them explicitly; the backend mirrors them via bean-validation annotations.

## Running checks (the standard gate)

Frontend — after any change run, in `frontend/`:

```bash
npm run typecheck && npm run lint && npm run format:check
npm run test:coverage   # vitest + coverage threshold 90% for src/lib/** and src/api/**
npm run test:e2e        # Playwright vs MSW mock (build:e2e via vite build --mode test)
npm run test:e2e:smoke  # Playwright vs Prism; needs openapi.yaml generated
```

Backend — after any `backend/` change:

```bash
JAVA_HOME=/home/eugene/.sdkman/candidates/java/25.0.4-tem ./gradlew build   # JUnit 5 + MockMvc
```

Single test: `npx vitest run <path>` (unit: `src/**/*.test.ts`, dom/jsdom: `src/**/*.test.tsx`). Single e2e: `npx playwright test guest.spec.ts`. Single backend test: `./gradlew test --tests '*EventApiTest'`.

## Environment facts agents get wrong

- `.npmrc` sets `legacy-peer-deps=true` — required for peer conflicts (react-hook-form vs ajv-formats, typescript 6). Don't remove it.
- Tests pin `TZ=Europe/Moscow` (vite.config.ts and playwright configs). Core date util `src/lib/slots.ts` groups by local day — a changed TZ silently breaks tests.
- Vitest has two projects (`unit` node, `dom` jsdom); config lives in `vite.config.ts`, not a separate file.
- `VITE_API_BASE_URL` is the only backend hook. If unset/empty, requests fail fast and a banner "API не настроен" appears instead of requests (see `src/api/config.ts`).
- Local dev against the real backend: `JAVA_HOME=/home/eugene/.sdkman/candidates/java/25.0.4-tem ./gradlew bootRun` + `npm run dev`. Vite reads `.env` (API base `http://127.0.0.1:4010`) at startup — a stale dev server keeps its old baked-in base URL; restart it after changing `.env`. `npm run mock:api` (Prism) is an alternative only when the backend is down (port conflict).

## Repo conventions

- All user-visible text is Russian and lives in `src/lib/messages.ts` (`format`/`plural` helpers); error texts map in `src/lib/errorMessages.ts`. Never hardcode Cyrillic strings in components (`src/components/ui/**` excluded — it's shadcn-generated).
- `src/components/ui/*` is generated by `npx shadcn@latest add`. Known registry bugs (broken `IconPlaceholder` import in `calendar.tsx`, the empty-files `form` add) require manual fixes — see PLAN.md step 4; don't blindly re-add components.
- API layer: `src/api/` wraps the openapi-fetch client; errors normalized into `ApiError`/`NetworkError` via `src/api/errors.ts` (`kind` mapping for 409 `slot_already_booked`, 400 `slot_not_available`).
- Routes in `src/router.tsx` are exported as `routes` so tests build `createMemoryRouter(routes, { initialEntries })`.
- MSW powers both unit/component tests (`src/test/server.ts`) and E2E (`src/test/browser.ts`, worker started in `src/main.tsx` only when `VITE_ENABLE_MSW === 'true'`). `onUnhandledRequest: 'error'` — an unmocked request fails the test.
- With no MSW, E2E tests against the Prism mock (openapi.yaml). Keep mock behavior aligned with the contract — `src/test/contract.test.ts` validates MSW responses against the spec with Ajv.
- E2E fixtures must contain slots across ≥3 days including a next-month day; dates are relative to "today" and the clock is fixed in tests (`page.clock.setFixedTime`).
- Admin + admin-initiated flows deliberately sort bookings client-side by `start` (the contract doesn't guarantee order).
- `typespec/` uses `@typespec/openapi3` → OpenAPI 3.1.0, output `{output-dir}/schema`.
- Never edit `.github/workflows/hexlet-check.yml` (generated, "DO NOT DELETE OR EDIT"); also don't touch `.github/` — the correct covering add is `.github/workflows/frontend.yml`.
- Backend error bodies mirror the contract `Error`/`SlotAlreadyBookedError`/`SlotNotAvailableError` (see `web/ApiExceptionHandler.java`); bean validation annotations mirror the zod rules in `frontend/src/lib/validation/eventType.ts`. When changing validation, change both sides and `typespec/`.

## Коммиты

Формат сообщений коммитов — **Conventional Commits**, обязателен для коммитов агента:

- Типы: `feat:`, `fix:`, `refactor:`, `test:`, `ci:`, `docs:`, `chore:`, `perf:`, `build:`.
- Опционально `scope` в скобках после типа, например `test(e2e):`.
- Ломающие изменения — `!` после типа/scope или строка `BREAKING CHANGE:` в теле.

Формат проверяется автоматически в CI (`commitlint` в `.github/workflows/commit-lint.yml`, на `pull_request`).

`release-please` (этап D) версионирует релиз по этому формату — некорректное сообщение (`feat`, `fix`, `BREAKING CHANGE`) сдвигает версию и ломает changelog. История должна оставаться в Conventional Commits.