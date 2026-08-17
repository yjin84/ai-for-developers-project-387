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
