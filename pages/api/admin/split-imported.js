import prisma from '../../../lib/prisma'

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
      tag = 'Imported',
      categories = ['cursor', 'copilot'],
      filterCategory = null,
      limit = null,
      randomize = true,
      dryRun = false
    } = req.body || {}

    if (!Array.isArray(categories) || categories.length < 2) {
      return res.status(400).json({ error: 'Provide at least two categories' })
    }

    const where = { filters: { has: tag } }
    if (filterCategory) where.category = filterCategory

    const all = await prisma.prompt.findMany({ where, orderBy: { createdAt: 'desc' } })
    let items = [...all]
    if (randomize) items.sort(() => Math.random() - 0.5)
    if (limit && Number(limit) > 0) items = items.slice(0, Number(limit))

    const updates = []
    const counts = Object.fromEntries(categories.map(c => [c, 0]))
    for (let i = 0; i < items.length; i++) {
      const targetCat = categories[i % categories.length]
      const it = items[i]
      if (it.category === targetCat) { counts[targetCat]++; continue }
      if (!dryRun) {
        const u = prisma.prompt.update({ where: { id: it.id }, data: { category: targetCat } })
        updates.push(u)
      }
      counts[targetCat]++
    }

    let applied = 0
    if (!dryRun && updates.length) {
      const results = await prisma.$transaction(updates)
      applied = results.length
    }

    return res.status(200).json({
      totalMatched: all.length,
      totalConsidered: items.length,
      applied,
      perCategory: counts,
      dryRun
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'split_failed', details: e?.message })
  }
}
