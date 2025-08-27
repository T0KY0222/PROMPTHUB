// Parses prompts from prompts_gpt.txt, strips @mentions, skips harmful ones,
// writes data/gpt_import.json, and attempts to POST each to /api/prompts.
// Usage: npm run import:gpt

const fs = require('fs')
const path = require('path')
const { URL } = require('url')
const http = require('http')
const https = require('https')

const ROOT = process.cwd()
const RAW_FILE = path.resolve(ROOT, 'prompts_gpt.txt')
const OUT_DIR = path.resolve(ROOT, 'data')
const OUT_FILE = path.resolve(OUT_DIR, 'gpt_import.json')
const API_URL = process.env.IMPORT_API_URL || 'http://localhost:3000/api/prompts'
const OWNER = process.env.IMPORT_OWNER || 'SEED_SYSTEM'
const DEFAULT_PRICE = Number(process.env.IMPORT_PRICE || 0)
const CATEGORY = process.env.IMPORT_CATEGORY || 'gpt'

function stripAtMentions(str = '') {
  return String(str)
    .replace(/(^|\s)@[^\s.,;:!?)\]}]+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function isHeader(line) {
  return /^act\s+as\b/i.test(line)
}

function isSkippableLine(line) {
  return /^contributed by\b/i.test(line)
      || /^reference\b/i.test(line)
      || /^alternative to\b/i.test(line)
      || /^examples\b/i.test(line)
      || /^\[caveat/i.test(line)
      || /^examples?:/i.test(line)
}

function isHarmfulTitle(t) {
  return /\bgaslighter\b/i.test(t)
}

function deriveFiltersFromTitle(title) {
  const t = title.toLowerCase()
  const tags = new Set(['Chat'])

  const add = (...xs) => xs.forEach(x => x && tags.add(x))

  // Purpose-like
  if (/translator|pronunciation|morse/.test(t)) add('Education', 'Language')
  if (/teacher|tutor|instructor|academician|educational content/.test(t)) add('Education')
  if (/reviewer|critic|analyzer|statistician|fallacy|data visualizer|analyst/.test(t)) add('Analysis')
  if (/tester|qa|sql terminal|linux terminal|javascript console/.test(t)) add('Testing', 'Technology')
  if (/prompt generator|title generator|essay writer|storyteller|poet|rapper|screenwriter|novelist|content/.test(t)) add('Documentation', 'Writing')
  if (/security|password/.test(t)) add('Security', 'Technology')
  if (/architect/.test(t)) add('Architecture', 'Technology')

  // Task-like
  if (/interview/.test(t)) add('Interview')
  if (/coach|motivational|life coach|debate coach|elocutionist|yogi|personal trainer/.test(t)) add('Coaching')
  if (/debate|debater/.test(t)) add('Debate')
  if (/design|ux|ui|interior|florist|artist/.test(t)) add('Design')
  if (/composer|rapper|poet|musician|music/.test(t)) add('Music')
  if (/doctor|dentist|psychologist|therapist|mental health|dietitian|ai assisted doctor|hypnotherapist/.test(t)) add('Health')
  if (/recruiter|career|interview/.test(t)) add('Business')
  if (/accountant|investment|financial|analyst/.test(t)) add('Finance', 'Business')
  if (/ethereum|blockchain|solidity/.test(t)) add('Programming', 'Blockchain')
  if (/programmer|developer|console|terminal|sql/.test(t)) add('Programming', 'Technology')
  if (/travel/.test(t)) add('Travel', 'Everyday Tasks')
  if (/magician|storyteller|game|tic-tac-toe|adventure/.test(t)) add('Entertainment')
  if (/self-help|gnomist|aphorism|influencer|social media|domain name/.test(t)) add('Marketing', 'Everyday Tasks')
  if (/chef|diet/.test(t)) add('Food', 'Everyday Tasks')
  if (/mechanic|automobile/.test(t)) add('Automotive', 'Everyday Tasks')

  return Array.from(tags)
}

function parseBlocks(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let current = null

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trim()

    if (!line) {
      if (current) current.lines.push('')
      continue
    }

    if (isHeader(line)) {
      if (current) blocks.push(current)
      current = { title: line, lines: [] }
      continue
    }

    if (!current) continue
    if (isSkippableLine(line)) continue

    current.lines.push(rawLine)
  }

  if (current) blocks.push(current)
  return blocks
}

function buildItems(blocks) {
  const items = []
  for (const b of blocks) {
    const title = stripAtMentions(b.title)
    if (!title || isHarmfulTitle(title)) continue
    const content = stripAtMentions(b.lines.join('\n').trim())
    if (!content) continue
    const filters = deriveFiltersFromTitle(title)
    items.push({
      title,
      content,
      priceSol: DEFAULT_PRICE,
      category: CATEGORY,
      filters
    })
  }
  return items
}

function postJSON(urlStr, body, headers = {}) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr)
      const data = Buffer.from(JSON.stringify(body))
      const isHttps = u.protocol === 'https:'
      const opts = {
        method: 'POST',
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + (u.search || ''),
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          ...headers
        }
      }

      const req = (isHttps ? https : http).request(opts, (res) => {
        let out = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => { out += chunk })
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, status: res.statusCode, text: out })
          } else {
            resolve({ ok: false, status: res.statusCode || 0, text: out })
          }
        })
      })
      req.on('error', (err) => {
        resolve({ ok: false, status: 0, text: String(err && err.message || 'error') })
      })
      req.write(data)
      req.end()
    } catch (e) {
      resolve({ ok: false, status: 0, text: String(e && e.message || 'error') })
    }
  })
}

async function tryPost(item) {
  // Prefer global fetch if available (Node 18+), else fallback to http/https
  if (typeof fetch !== 'undefined') {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-owner': OWNER },
        body: JSON.stringify(item)
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText)
        console.warn(`POST failed ${res.status}: ${msg}`)
        return false
      }
      return true
    } catch (e) {
      console.warn('POST error:', e.message)
      return false
    }
  }
  const r = await postJSON(API_URL, item, { 'x-owner': OWNER })
  if (!r.ok) console.warn(`POST failed ${r.status}: ${r.text}`)
  return r.ok
}

async function main() {
  if (!fs.existsSync(RAW_FILE)) {
    console.error(`Not found: ${RAW_FILE}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(RAW_FILE, 'utf8')
  const blocks = parseBlocks(raw)
  const items = buildItems(blocks)

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_FILE, JSON.stringify(items, null, 2), 'utf8')
  console.log(`Saved ${items.length} prompts -> ${path.relative(ROOT, OUT_FILE)}`)

  const seedSecret = process.env.SEED_SECRET
  if (seedSecret) {
    // Prefer admin seed endpoint for upsert/replace
    const adminUrl = process.env.SEED_URL || 'http://localhost:3000/api/admin/seed-gpt'
    const payload = {
      category: CATEGORY,
      replace: true,
      defaultPrice: DEFAULT_PRICE,
      prompts: items.map(i => ({
        title: i.title,
        content: i.content,
        priceSol: i.priceSol,
        tags: i.filters,
        category: i.category,
        owner: OWNER
      }))
    }
    const r = await postJSON(adminUrl, payload, { 'x-seed-secret': seedSecret })
    if (r.ok) {
      console.log(`Seeded via admin API: ${adminUrl} -> ${r.status}`)
      return
    }
    console.warn(`Admin seed failed (${r.status}). Falling back to per-item POSTs.`)
  }

  let ok = 0
  for (const it of items) {
    const sent = await tryPost(it)
    if (sent) ok++
  }
  if (ok) {
    console.log(`Posted ${ok}/${items.length} prompts to ${API_URL}`)
  } else {
    console.log('No prompts posted (server down or endpoint unavailable). JSON export completed.')
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
