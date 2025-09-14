const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('🔍 Проверяем подключение к базе данных...')
    
    // Проверяем подключение
    await prisma.$connect()
    console.log('✅ Подключение к базе данных успешно!')
    
    // Проверяем количество промптов
    const count = await prisma.prompt.count()
    console.log(`📊 Всего промптов в базе: ${count}`)
    
    // Показываем первые 3 промпта
    const prompts = await prisma.prompt.findMany({
      take: 3,
      select: {
        id: true,
        title: true,
        category: true,
        priceSol: true,
        createdAt: true
      }
    })
    
    console.log('📝 Первые 3 промпта:')
    prompts.forEach((prompt, index) => {
      console.log(`${index + 1}. ${prompt.title} (${prompt.category}) - ${prompt.priceSol} SOL`)
    })
    
  } catch (error) {
    console.error('❌ Ошибка при работе с базой данных:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()