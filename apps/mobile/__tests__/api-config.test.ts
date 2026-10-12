import { normalizeBaseUrl, resolveBaseUrlForPlatform } from '../src/api/config'

describe('normalizeBaseUrl', () => {
  it('falls back to localhost when empty', () => {
    expect(normalizeBaseUrl(undefined)).toBe('http://localhost:8080')
    expect(normalizeBaseUrl('  ')).toBe('http://localhost:8080')
  })

  it('trims trailing slashes', () => {
    expect(normalizeBaseUrl('http://localhost:8088//')).toBe('http://localhost:8088')
  })
})

describe('resolveBaseUrlForPlatform', () => {
  it('maps the Android emulator alias to localhost when running in a browser', () => {
    expect(resolveBaseUrlForPlatform('http://10.0.2.2:8088', 'web')).toBe('http://localhost:8088')
  })

  it('keeps the emulator alias on native platforms', () => {
    expect(resolveBaseUrlForPlatform('http://10.0.2.2:8088', 'android')).toBe('http://10.0.2.2:8088')
    expect(resolveBaseUrlForPlatform('http://10.0.2.2:8088', 'ios')).toBe('http://10.0.2.2:8088')
  })

  it('does not touch other hosts on web', () => {
    expect(resolveBaseUrlForPlatform('http://192.168.1.20:8088', 'web')).toBe('http://192.168.1.20:8088')
  })
})
