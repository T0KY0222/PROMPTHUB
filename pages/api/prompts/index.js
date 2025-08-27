import prisma from '../../../lib/prisma'
import { sanitizePromptFields } from '../../../utils/sanitize'

export default async function handler(req, res) {
  console.log('API Request:', {
    method: req.method,
    query: req.query,
    headers: {
      'x-viewer': req.headers['x-viewer'],
      'x-owner': req.headers['x-owner']
    }
  });

  try {
    // Test database connection first
    await prisma.$connect();
    console.log('Database connected successfully');

    if (req.method === 'GET') {
      const { id, category, filters, price } = req.query
      const viewer = (req.headers['x-viewer'] || '').toString()
      if (id) {
  // Fetch a single prompt by id
  const rows = await prisma.$queryRaw`SELECT id, title, content, "priceSol", owner, category, buyers, filters, "createdAt" FROM "Prompt" WHERE id = ${id}`
  const p = Array.isArray(rows) ? rows[0] : null
  if (!p) return res.status(404).json({ error: 'Not found' })
  // Redact paid content unless viewer is owner or buyer
  let result = p
  try {
    const isOwner = viewer && viewer === p.owner
    const isBuyer = viewer && Array.isArray(p.buyers) && p.buyers.includes(viewer)
    const hasAccess = p.priceSol <= 0 || isOwner || isBuyer
    
    if (hasAccess) {
      result = { ...p, locked: false }
    } else {
      result = { ...p, content: '', locked: true }
    }
  } catch {
    result = { ...p, content: '', locked: true }
  }
  return res.status(200).json(result)
    }
    const q = {}
    if (category) q.category = category
    
    // filters is a comma-separated list from query
    if (filters) {
      const f = Array.isArray(filters) ? filters : String(filters).split(',').map(s => s.trim()).filter(Boolean)
      if (f.length) q.filters = { hasSome: f }
    }
    
    // Handle price filtering
    if (price) {
      const priceFilters = Array.isArray(price) ? price : String(price).split(',').map(s => s.trim()).filter(Boolean)
      if (priceFilters.includes('free') && priceFilters.includes('paid')) {
        // Both free and paid selected - no price filter needed
      } else if (priceFilters.includes('free')) {
        q.priceSol = { equals: 0 }
      } else if (priceFilters.includes('paid')) {
        q.priceSol = { gt: 0 }
      }
    }
    
    const where = Object.keys(q).length ? { where: q } : {}
    console.log('Database query:', where);
    
    const prompts = await prisma.prompt.findMany({ ...(where), orderBy: { createdAt: 'desc' } })
    console.log('Prompts found:', prompts?.length || 0);
  // Redact paid content for unauthorized viewers
  const safe = (prompts || []).map(p => {
    try {
      const isOwner = viewer && viewer === p.owner
      const isBuyer = viewer && Array.isArray(p.buyers) && p.buyers.includes(viewer)
      const hasAccess = p.priceSol <= 0 || isOwner || isBuyer
      
      if (hasAccess) {
        return { ...p, locked: false }
      } else {
        return { ...p, content: '', locked: true }
      }
    } catch {
      return { ...p, content: '', locked: true }
    }
  })
  return res.status(200).json(safe)
  }

  if (req.method === 'POST') {
  const { title, content, priceSol, category, filters } = req.body
    const owner = req.headers['x-owner'] || null
    if (!owner) return res.status(400).json({ error: 'Missing x-owner header' })
  const clean = sanitizePromptFields({ title, content: content || '' })
  const data = { title: clean.title, content: clean.content, priceSol: parseFloat(priceSol) || 0, owner, category: category || null }
    if (filters && Array.isArray(filters)) data.filters = filters
    const p = await prisma.prompt.create({ data })
    return res.status(201).json(p)
  }

  res.setHeader('Allow', ['GET','POST'])
  res.status(405).end('Method not allowed')
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Disconnect error:', disconnectError);
    }
  }
}
