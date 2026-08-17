import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Поведение клиента и конфигурации зависит от значения `VITE_API_BASE_URL`
 * на момент загрузки модуля — поэтому каждый тест подменяет окружение
 * (`vi.stubEnv` + `vi.resetModules`) и импортирует модуль заново.
 *
 * `instanceof` здесь нельзя проверять классом из шапки файла: после
 * `resetModules` клиент грузит свой экземпляр `errors`, поэтому класс
 * берётся из переимпортированного модуля.
 */
describe('api/client', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  beforeEach(() => {
    vi.resetModules()
  })

  it('при пустой базе запрос мгновенно падает с NetworkError и флагом notConfigured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '   ')
    const { apiClient } = await import('./client')
    const { NetworkError } = await import('./errors')

    const error = (await apiClient.GET('/event-types').catch((e) => e)) as InstanceType<
      typeof NetworkError
    >

    expect(error).toBeInstanceOf(NetworkError)
    expect(error.notConfigured).toBe(true)
  })

  it('отсутствующая переменная делает apiBaseUrl undefined и конфигурацию неактивной', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    const { apiBaseUrl, isApiConfigured } = await import('./config')

    expect(apiBaseUrl).toBeUndefined()
    expect(isApiConfigured).toBe(false)
  })

  it('непустая база обрезает завершающие слэши и включает конфигурацию', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com///')
    const { apiBaseUrl, isApiConfigured } = await import('./config')

    expect(apiBaseUrl).toBe('https://api.example.com')
    expect(isApiConfigured).toBe(true)
  })

  it('VITE_API_BASE_URL=/ даёт пустую базу (same-origin) и активную конфигурацию', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '/')
    const { apiBaseUrl, isApiConfigured } = await import('./config')

    expect(apiBaseUrl).toBe('')
    expect(isApiConfigured).toBe(true)
  })

  it('same-origin база не вызывает короткого замыкания notConfigured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '/')
    const { apiClient } = await import('./client')
    const { NetworkError } = await import('./errors')

    const error = await apiClient.GET('/event-types').catch((e) => e)

    expect(error).not.toBeInstanceOf(NetworkError)
    expect((error as { notConfigured?: boolean }).notConfigured).toBeUndefined()
  })
})
