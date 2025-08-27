import prisma from '../../../lib/prisma'
import { sanitizePromptFields } from '../../../utils/sanitize'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method not allowed')
  }
  const secret = process.env.SEED_SECRET || ''
  if (!secret || req.headers['x-seed-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const {
      prompts = [],
      defaultPrice = 0,
      category: bodyCategory = 'gpt',
      replace = false
    } = req.body || {}

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ error: 'No prompts provided' })
    }

    // Optional: replace existing prompts for this category
    if (replace) {
      await prisma.prompt.deleteMany({ where: { category: bodyCategory } })
    }

    const results = { created: 0, updated: 0, skipped: 0 }
    const upserts = []

    for (const raw of prompts) {
      const title = (raw.title || '').trim()
      const contentRaw = raw.prompt || raw.content || ''
      const priceSol = typeof raw.priceSol === 'number' ? raw.priceSol : defaultPrice
      const filters = Array.isArray(raw.tags) ? raw.tags.filter(Boolean) : []
      const category = (raw.category || bodyCategory || 'gpt').trim() || 'gpt'
      const owner = raw.owner || 'SEED_SYSTEM'

      if (!title || !contentRaw) {
        results.skipped++
        continue
      }

      const clean = sanitizePromptFields({ title, content: contentRaw })

      // Dedupe by (title, category)
      const existing = await prisma.prompt.findFirst({
        where: { title: clean.title, category }
      })

      if (existing) {
        const updated = await prisma.prompt.update({
          where: { id: existing.id },
          data: {
            content: clean.content,
            priceSol: priceSol || 0,
            filters
          }
        })
        upserts.push(updated)
        results.updated++
      } else {
        const created = await prisma.prompt.create({
          data: {
            title: clean.title,
            content: clean.content,
            priceSol: priceSol || 0,
            owner,
            category,
            filters
          }
        })
        upserts.push(created)
        results.created++
      }
    }

    return res.status(201).json({ ...results, prompts: upserts })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'seed_failed', details: e?.message })
  }
}
