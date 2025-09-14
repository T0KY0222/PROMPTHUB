import prisma from '../../../lib/prisma'
import { sanitizePromptFields } from '../../../utils/sanitize'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { id, category, filters, price, search } = req.query
      const viewer = (req.headers['x-viewer'] || '').toString()
      
      if (id) {
        // Оптимизированный запрос одного промпта
        const prompt = await prisma.prompt.findUnique({
          where: { id: id },
          select: {
            id: true,
            title: true,
            content: true,
            priceSol: true,
            owner: true,
            category: true,
            buyers: true,
            filters: true,
            createdAt: true
          }
        })
        
        if (!prompt) return res.status(404).json({ error: 'Not found' })
        
        // Проверка доступа
        const isOwner = viewer && viewer === prompt.owner
        const isBuyer = viewer && Array.isArray(prompt.buyers) && prompt.buyers.includes(viewer)
        const hasAccess = prompt.priceSol <= 0 || isOwner || isBuyer
        
        const result = hasAccess 
          ? { ...prompt, locked: false }
          : { ...prompt, content: '', locked: true }
          
        return res.status(200).json(result)
      }

      // Построение оптимизированного where clause
      const whereClause = {}
      
      if (category && category !== 'all') {
        whereClause.category = category
      }
      
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (filters) {
        const filterArray = Array.isArray(filters) 
          ? filters 
          : String(filters).split(',').map(s => s.trim()).filter(Boolean)
        if (filterArray.length) {
          whereClause.filters = { hasSome: filterArray }
        }
      }
      
      if (price) {
        const priceFilters = Array.isArray(price) 
          ? price 
          : String(price).split(',').map(s => s.trim()).filter(Boolean)
        if (priceFilters.includes('free') && !priceFilters.includes('paid')) {
          whereClause.priceSol = { equals: 0 }
        } else if (priceFilters.includes('paid') && !priceFilters.includes('free')) {
          whereClause.priceSol = { gt: 0 }
        }
      }

      // Запрос без лимита
      const prompts = await prisma.prompt.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          content: true,
          priceSol: true,
          owner: true,
          category: true,
          buyers: true,
          filters: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })

      // Быстрая обработка доступа
      const processedPrompts = prompts.map(prompt => {
        const isOwner = viewer && viewer === prompt.owner
        const isBuyer = viewer && Array.isArray(prompt.buyers) && prompt.buyers.includes(viewer)
        const hasAccess = prompt.priceSol <= 0 || isOwner || isBuyer
        
        return hasAccess 
          ? { ...prompt, locked: false }
          : { ...prompt, content: '', locked: true }
      })

      return res.status(200).json(processedPrompts)
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
    console.error('Database URL exists:', !!process.env.DATABASE_URL);
    console.error('Direct URL exists:', !!process.env.DIRECT_URL);
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
}
