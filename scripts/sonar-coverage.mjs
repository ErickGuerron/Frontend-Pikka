// Prepares the lcov reports of the web and mobile apps for Sonar and verifies them.
//
// Vitest and Jest write "SF:" paths relative to each app (src/app/App.tsx, with backslashes on Windows),
// but Sonar resolves them against the repository root. This rewrites every path to be repo-relative
// (apps/web/src/app/App.tsx) and fails when a report is missing, empty, or points at a file that does
// not exist. Such a report would make Sonar silently show 0% coverage.
//
// Usage (from the repository root): node scripts/sonar-coverage.mjs [appDir ...]   (default: apps/web apps/mobile)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'

const root = process.cwd()
const apps = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['apps/web', 'apps/mobile']

const toRepoPath = (appDir, file) => {
  // Already repo-relative (a previous run): keep it, so running the script twice is harmless.
  const normalized = file.split('\\').join('/')
  const prefix = `${appDir.split('\\').join('/')}/`
  if (!isAbsolute(file) && normalized.startsWith(prefix)) return normalized
  const abs = isAbsolute(file) ? file : resolve(root, appDir, file)
  return relative(root, abs).split('\\').join('/')
}

let failed = false
for (const appDir of apps) {
  const report = join(appDir, 'coverage', 'lcov.info')
  if (!existsSync(report)) {
    console.error(`FAIL: ${report} not found (run the app's coverage script first)`)
    failed = true
    continue
  }

  const missing = []
  let files = 0
  const lines = readFileSync(report, 'utf8')
    .split(/\r?\n/)
    .map((line) => {
      if (!line.startsWith('SF:')) return line
      files += 1
      const repoPath = toRepoPath(appDir, line.slice(3))
      if (!existsSync(resolve(root, repoPath))) missing.push(repoPath)
      return `SF:${repoPath}`
    })

  if (files === 0) {
    console.error(`FAIL: ${report} has no source files`)
    failed = true
  } else if (missing.length > 0) {
    console.error(`FAIL: ${report} references files that do not exist in the repository:`)
    for (const p of missing.slice(0, 10)) console.error(`  ${p}`)
    failed = true
  } else {
    writeFileSync(report, lines.join('\n'))
    console.log(`ok: ${report} (${files} files)`)
  }
}

if (failed) process.exit(1)
console.log(`sonar coverage ready: ${apps.length} report(s)`)
