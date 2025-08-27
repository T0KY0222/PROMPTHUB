import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const file = path.resolve('data/generated_prompts_deepseek.json')
  const raw = fs.readFileSync(file, 'utf8')
  const data = JSON.parse(raw)
  const prompts = Array.isArray(data.prompts) ? data.prompts : []
  if (!prompts.length) {
    console.error('No prompts to import')
    process.exit(1)
  }
  let created = 0, updated = 0, skipped = 0
  for (const p of prompts) {
    const title = (p.title || '').trim()
    const content = (p.content || p.prompt || '').trim()
    if (!title || !content) { skipped++; continue }
    const category = (p.category || 'deepseek').trim()
    const priceSol = typeof p.priceSol === 'number' ? p.priceSol : (data.defaultPrice || 0)
    const filters = Array.isArray(p.tags) ? p.tags.filter(Boolean) : (Array.isArray(p.filters) ? p.filters.filter(Boolean) : [])

    const existing = await prisma.prompt.findFirst({ where: { title, category } })
    if (existing) {
      await prisma.prompt.update({ where: { id: existing.id }, data: { content, priceSol, filters } })
      updated++
    } else {
      await prisma.prompt.create({ data: { title, content, priceSol, owner: 'SEED_SYSTEM', category, filters } })
      created++
    }
  }
  console.log(JSON.stringify({ created, updated, skipped }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
