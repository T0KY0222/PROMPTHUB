const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Database connection successful!')
  
  // Check if tables exist
  const promptCount = await prisma.prompt.count()
  console.log(`Found ${promptCount} prompts in database`)
  
  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('Database connection failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
