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

  const { category = 'gpt', fraction = 0.333, price = 0.1 } = req.body || {}
  if (fraction <= 0 || fraction > 1) return res.status(400).json({ error: 'invalid_fraction' })
  const payout = process.env.PAYOUT_WALLET || 'LHAh4zrDypxy7n6STwK89nQKXVaJzj3FNArW81E89ak'

  const all = await prisma.prompt.findMany({ where: { category }, orderBy: { createdAt: 'asc' } })
  const n = all.length
  const k = Math.floor(n * fraction)
  if (k === 0) return res.status(200).json({ updated: 0, total: n })

  // Choose first k prompts deterministically (by createdAt asc)
  const targets = all.slice(0, k)
  let updated = 0
  for (const p of targets) {
    await prisma.prompt.update({ where: { id: p.id }, data: { priceSol: price, owner: payout } })
    updated++
  }
  return res.status(200).json({ updated, total: n, price, payout })
}
