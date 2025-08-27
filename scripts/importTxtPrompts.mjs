import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = ['claude','grok','deepseek','copilot','cursor']

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { input: 'promptsnew.txt', categories: DEFAULT_CATEGORIES, dryRun: false }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if ((a === '--input' || a === '-i') && args[i+1]) { out.input = args[++i]; continue }
    if ((a === '--categories' || a === '-c') && args[i+1]) { out.categories = args[++i].split(',').map(s=>s.trim()).filter(Boolean); continue }
    if (a === '--dry-run') { out.dryRun = true; continue }
  }
  return out
}

function splitBlocks(text) {
  // Split on lines that are only dashes (5 or more) or multiple newlines sequences
  const parts = text.split(/\n\s*-{5,}\s*\n|\n{3,}/g).map(s => s.trim()).filter(Boolean)
  return parts
}

function firstNonEmptyLine(block) {
  for (const line of block.split(/\r?\n/)) {
    const t = line.trim()
    if (t.length > 0) return t
  }
  return 'Untitled Prompt'
}

function makeTitleFromLine(line) {
  const t = line.replace(/^#+\s*/, '').trim()
  return t.length > 120 ? t.slice(0, 117) + '...' : t
}

function classifyFilters(text) {
  const t = text.toLowerCase()
  const tags = new Set()
  // General
  tags.add('Imported')
  tags.add('FromTxt')
  // Topic-based heuristics
  if (/(chinese|english|translate|translation)/.test(t)) tags.add('translation')
  if (/(prompt\s*engineer|prompt\s*creator|super\s*prompt|promptagent|llm)/.test(t)) tags.add('prompt-engineering')
  if (/(career|resume|cv)/.test(t)) tags.add('career')
  if (/(movie|tv|synopsis)/.test(t)) tags.add('entertainment')
  if (/(holiday|party|event)/.test(t)) tags.add('events')
  if (/(chemistry)/.test(t)) { tags.add('education'); tags.add('science') }
  if (/(html|css|javascript|codepen|webcam)/.test(t)) { tags.add('web'); tags.add('frontend') }
  if (/(software requirements|softgpt|requirements)/.test(t)) { tags.add('software'); tags.add('product') }
  if (/(scss)/.test(t)) { tags.add('css'); tags.add('scss') }
  if (/(plugin)/.test(t)) tags.add('plugins')
  if (/(flowchart)/.test(t)) tags.add('diagram')
  if (/(stock trader|trader|trading)/.test(t)) { tags.add('finance'); tags.add('trading') }
  if (/(finviz|candlestick|forex|crypto|futures)/.test(t)) { tags.add('finance'); tags.add('charts') }
  if (/(current affairs|self-media|marketing|content strategy|traffic)/.test(t)) tags.add('marketing')
  if (/(instagram|reels|hashtags)/.test(t)) { tags.add('social'); tags.add('instagram') }
  return Array.from(tags)
}

async function upsertPrompts(blocks, categories, dryRun) {
  let created = 0, updated = 0, skipped = 0
  let i = 0
  for (const block of blocks) {
    const content = block.trim()
    if (!content) { skipped++; continue }
    const titleLine = firstNonEmptyLine(content)
    const title = makeTitleFromLine(titleLine)
    const category = categories[i % categories.length]
    i++
    const filters = classifyFilters(content)
    if (dryRun) { created++; continue }

    const existing = await prisma.prompt.findFirst({ where: { title, category } })
    if (existing) {
      await prisma.prompt.update({ where: { id: existing.id }, data: { content, filters } })
      updated++
    } else {
      await prisma.prompt.create({ data: { title, content, priceSol: 0, owner: 'SEED_SYSTEM', category, filters } })
      created++
    }
  }
  return { created, updated, skipped }
}

async function main() {
  const opts = parseArgs()
  const p = path.resolve(opts.input)
  const raw = fs.readFileSync(p, 'utf8')
  const blocks = splitBlocks(raw)
  const res = await upsertPrompts(blocks, opts.categories, opts.dryRun)
  console.log(JSON.stringify({ input: opts.input, blocks: blocks.length, categories: opts.categories, dryRun: opts.dryRun, ...res }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
