// Auto rebuild + restart on file changes (production mode)
import { watch } from 'fs'
import { spawn, spawnSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const next = join(root, 'node_modules/.bin/next')

let server = null
let timer = null

function kill() {
  if (server) { server.kill(); server = null }
}

function build() {
  const result = spawnSync(next, ['build'], { cwd: root, stdio: 'inherit' })
  return result.status === 0
}

function start() {
  server = spawn(next, ['start', '-H', '0.0.0.0'], { cwd: root, stdio: 'inherit' })
}

function rebuild() {
  console.log('\n[watch] rebuilding...')
  kill()
  if (build()) { start(); console.log('[watch] ready') }
  else { console.log('[watch] build failed — fix errors and save again') }
}

function schedule() {
  clearTimeout(timer)
  timer = setTimeout(rebuild, 800)
}

// Initial build + start
console.log('[watch] initial build...')
if (build()) start()

// Watch source dirs
for (const dir of ['app', 'components', 'types', 'mocks', 'lib']) {
  try {
    watch(join(root, dir), { recursive: true }, (_, f) => {
      if (f && /\.(ts|tsx|css|json)$/.test(f)) {
        console.log(`[watch] changed: ${f}`)
        schedule()
      }
    })
  } catch { /* dir may not exist */ }
}

console.log('[watch] watching for changes...')
process.on('SIGINT', () => { kill(); process.exit(0) })
