import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const owner = req.headers['x-owner']
      if (!owner) {
        return res.status(400).json({ error: 'Missing x-owner header' })
      }

      // Получаем все промпты пользователя
      const userPrompts = await prisma.prompt.findMany({
        where: { owner },
        select: { 
          id: true, 
          title: true, 
          priceSol: true,
          buyers: true,
          createdAt: true
        }
      })

      // Формируем уведомления о продажах
      const notifications = []
      let notificationId = 1

      for (const prompt of userPrompts) {
        if (prompt.buyers && Array.isArray(prompt.buyers) && prompt.buyers.length > 0) {
          // Для каждой продажи создаем уведомление
          prompt.buyers.forEach((buyer, index) => {
            // Примерная дата продажи (можно улучшить, добавив поле purchaseDate)
            const saleTime = new Date(prompt.createdAt.getTime() + (index + 1) * 24 * 60 * 60 * 1000)
            
            notifications.push({
              id: notificationId++,
              title: "🎉 Prompt Sold!",
              text: `Your prompt "${prompt.title.substring(0, 30)}${prompt.title.length > 30 ? '...' : ''}" was purchased for ${prompt.priceSol} SOL`,
              time: saleTime,
              read: false,
              promptId: prompt.id,
              buyer: buyer.substring(0, 8) + '...' + buyer.substring(buyer.length - 4)
            })
          })
        }
      }

      // Сортируем по дате (новые сначала)
      notifications.sort((a, b) => new Date(b.time) - new Date(a.time))

      return res.status(200).json(notifications.slice(0, 10)) // Последние 10 уведомлений
    }

    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method not allowed')
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    })
  }
}
