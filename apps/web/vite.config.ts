/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

export default defineConfig(({ mode }) => {
  // loadEnv lee .env, .env.local, .env.[mode]... process.env no los incluye en este archivo.
  const env = loadEnv(mode, process.cwd(), '')
  // En desarrollo, /api, /health y /ready se reenvían al API Gateway para evitar CORS.
  const gateway = env.VITE_DEV_GATEWAY_URL || 'http://localhost:8080'

  const toGateway: ProxyOptions = {
    target: gateway,
    configure: (proxy) => {
      // Si el Gateway no responde, se devuelve el mismo formato de error que él usa
      // para que la pantalla diga qué pasa en vez de "error inesperado".
      proxy.on('error', (_err, _req, res) => {
        if (!('writeHead' in res) || res.headersSent) return
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: { code: 'UPSTREAM_UNAVAILABLE', message: `API Gateway not reachable at ${gateway}` } }))
      })
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // apps/shared holds code used by both apps; the dev server must be allowed to serve it.
      fs: { allow: ['.', '../shared'] },
      proxy: { '/api': toGateway, '/health': toGateway, '/ready': toGateway },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
      coverage: {
        provider: 'v8',
        // lcov.info is what Sonar reads (see sonar-project.properties); text-summary is for humans.
        reporter: ['text-summary', 'lcov'],
        // Absolute, forward-slash glob: a "../" pattern is not matched against files outside the web root.
        include: ['src/**/*.{ts,tsx}', fileURLToPath(new URL('../shared/**/*.ts', import.meta.url)).split('\\').join('/')],
        // apps/shared lives outside the web root; without this, its coverage would be missing from lcov.
        allowExternal: true,
        exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/**/*.d.ts'],
      },
    },
  }
})
