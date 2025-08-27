import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { id, buyer } = req.body
    const p = await prisma.prompt.findUnique({ where: { id } })
    if (!p) return res.status(404).json({ error: 'Prompt not found' })
    const buyers = p.buyers || []
    if (!buyers.includes(buyer)) buyers.push(buyer)
    await prisma.prompt.update({ where: { id }, data: { buyers } })
    return res.status(200).json({ ok: true })
  }
  res.setHeader('Allow', ['POST'])
  res.status(405).end('Method not allowed')
}
