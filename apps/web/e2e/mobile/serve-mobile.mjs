// Exporta la app movil (Expo Router) a web y la sirve en MOBILE_WEB_PORT (4174) para Playwright.
// La salida va a test-results/ (ignorada por git). Las rutas desconocidas caen en index.html (SPA).
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const mobileRoot = resolve(webRoot, '../mobile')
const outDir = resolve(webRoot, 'test-results/mobile-web')
const port = Number(process.env.MOBILE_WEB_PORT ?? 4174)

const exported = spawnSync(`npx expo export --platform web --output-dir "${outDir}"`, {
  cwd: mobileRoot,
  shell: true,
  stdio: 'inherit',
})
if (exported.status !== 0) {
  console.error('expo export --platform web fallo')
  process.exit(exported.status ?? 1)
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

async function readInside(relativePath) {
  const file = normalize(join(outDir, relativePath))
  if (!file.startsWith(outDir)) return null
  try {
    return { file, body: await readFile(file) }
  } catch {
    return null
  }
}

createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
  const asset = (await readInside(pathname)) ?? (await readInside('index.html'))
  if (asset === null) {
    res.writeHead(404).end('not found')
    return
  }
  res.writeHead(200, { 'Content-Type': contentTypes[extname(asset.file)] ?? 'application/octet-stream' })
  res.end(asset.body)
}).listen(port, () => {
  console.log(`app movil en http://localhost:${port}`)
})
