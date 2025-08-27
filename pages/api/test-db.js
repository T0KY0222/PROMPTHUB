import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  console.log('🔍 Test DB API called');
  
  try {
    const prisma = new PrismaClient();
    
    console.log('📊 Environment variables:');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('DIRECT_URL exists:', !!process.env.DIRECT_URL);
    console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    console.log('📋 Counting prompts...');
    const count = await prisma.prompt.count();
    console.log(`📊 Found ${count} prompts`);
    
    if (count > 0) {
      console.log('📝 Getting first 3 prompts...');
      const prompts = await prisma.prompt.findMany({
        take: 3,
        select: { id: true, title: true }
      });
      console.log('📋 Sample prompts:', prompts);
    }
    
    await prisma.$disconnect();
    
    res.status(200).json({
      success: true,
      count,
      hasData: count > 0,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
        databaseUrlPreview: process.env.DATABASE_URL?.substring(0, 50) + '...'
      }
    });
    
  } catch (error) {
    console.error('❌ Test DB Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : 'Hidden in production'
    });
  }
}
