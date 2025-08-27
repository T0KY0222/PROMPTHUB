import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { source: 'gpt', targets: ['claude', 'grok'], fraction: 0.5, dryRun: false }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if ((a === '--source' || a === '-s') && args[i+1]) { out.source = args[++i]; continue }
    if ((a === '--targets' || a === '-t') && args[i+1]) { out.targets = args[++i].split(',').map(s=>s.trim()).filter(Boolean); continue }
    if ((a === '--fraction' || a === '-f') && args[i+1]) { out.fraction = Math.max(0, Math.min(1, parseFloat(args[++i]))); continue }
    if (a === '--dry-run') { out.dryRun = true; continue }
  }
  if (!out.targets.length) out.targets = ['claude','grok']
  return out
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function main() {
  const opts = parseArgs()
  const all = await prisma.prompt.findMany({ where: { category: opts.source }, orderBy: { createdAt: 'asc' } })
  const total = all.length
  const toMoveCount = Math.floor(total * opts.fraction)
  const selected = shuffle(all).slice(0, toMoveCount)

  let assignIndex = 0
  const assignments = selected.map(p => ({ id: p.id, title: p.title, oldCategory: p.category || opts.source, newCategory: opts.targets[assignIndex++ % opts.targets.length], priceSol: p.priceSol }))

  if (!opts.dryRun) {
    for (const a of assignments) {
      await prisma.prompt.update({ where: { id: a.id }, data: { category: a.newCategory } })
    }
    const stamp = new Date().toISOString().replace(/[:.]/g,'-')
    const backupPath = path.resolve('data', `rebalance_gpt_to_claude_grok.${stamp}.backup.json`)
    fs.writeFileSync(backupPath, JSON.stringify({ source: opts.source, targets: opts.targets, fraction: opts.fraction, moved: assignments }, null, 2))
  }

  const counts = {
    total,
    toMove: toMoveCount,
    perTarget: opts.targets.reduce((acc, t) => { acc[t] = assignments.filter(a => a.newCategory === t).length; return acc }, {})
  }

  console.log(JSON.stringify({ ...opts, counts }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
