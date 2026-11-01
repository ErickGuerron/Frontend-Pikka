import { defineConfig, devices } from '@playwright/test'

// E2E de la app movil (apps/mobile) en su build web (react-native-web), con viewport de telefono.
// Igual que la suite web, las llamadas al gateway se simulan con page.route: no requiere backend.
export default defineConfig({
  testDir: './e2e/mobile',
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4174',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 5'],
        ...(process.env.PW_CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } } : {}),
      },
    },
  ],
  webServer: {
    command: 'node e2e/mobile/serve-mobile.mjs',
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI,
    // La primera ejecucion exporta la app movil completa; puede tardar varios minutos.
    timeout: 900_000,
  },
})
