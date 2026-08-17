import { apiBaseUrl } from '@/api/config'

/**
 * Адрес мок-API, на который зарегистрированы MSW-хендлеры.
 *
 * Совпадает с `VITE_API_BASE_URL`, заданным в конфиге Vitest (`test.env`) и
 * в `.env.test` для E2E-сборки, — тогда запросы клиента попадают на хендлеры,
 * а `onUnhandledRequest: 'error'` ловит всё незамоканное.
 */
export const API_BASE_URL = apiBaseUrl ?? 'http://api.test'
