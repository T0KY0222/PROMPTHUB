import prisma from '../../../lib/prisma'
import { PublicKey } from '@solana/web3.js'

function isValidPubkey(s) {
  if (!s || typeof s !== 'string') return false
  const trimmed = s.trim()
  if (!trimmed) return false
  try {
    // Will throw if invalid
    // Also ensures a canonical base58 form
    // eslint-disable-next-line no-new
    new PublicKey(trimmed)
    return true
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.SEED_SECRET || ''
  if (!secret || req.headers['x-seed-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { category = 'gpt', dryRun = false } = req.body || {}
  const payout = process.env.PAYOUT_WALLET || 'LHAh4zrDypxy7n6STwK89nQKXVaJzj3FNArW81E89ak'

  if (!isValidPubkey(payout)) {
    return res.status(400).json({ error: 'Invalid PAYOUT_WALLET in environment' })
  }

  const where = { priceSol: { gt: 0 } }
  if (category) where.category = category

  const paid = await prisma.prompt.findMany({ where, orderBy: { createdAt: 'asc' } })
  let updated = 0
  const changedIds = []
  const invalidExamples = []

  for (const p of paid) {
    const owner = (p.owner || '').trim()
    const ok = isValidPubkey(owner)
    if (!ok) {
      if (!dryRun) {
        await prisma.prompt.update({ where: { id: p.id }, data: { owner: payout } })
      }
      updated++
      changedIds.push(p.id)
      if (invalidExamples.length < 5) invalidExamples.push({ id: p.id, prevOwner: p.owner })
    }
  }

  return res.status(200).json({ scanned: paid.length, updated, payout, dryRun, changedIds, invalidExamples })
}
