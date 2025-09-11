// Скрипт для автоматического добавления фильтров к промптам
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Ключевые слова для каждого фильтра
const filterKeywords = {
  'Code Generation': [
    'code', 'generate', 'create', 'build', 'function', 'class', 'script', 'programming', 
    'development', 'coding', 'algorithm', 'implementation', 'write code', 'генерация кода',
    'создание кода', 'программирование', 'разработка', 'javascript', 'python', 'react',
    'html', 'css', 'typescript', 'node', 'api', 'component', 'library', 'framework'
  ],
  
  'Code Review': [
    'review', 'analyze', 'check', 'audit', 'inspect', 'optimize', 'improve', 'refactor',
    'quality', 'best practices', 'security', 'performance', 'обзор кода', 'анализ кода',
    'проверка', 'оптимизация', 'улучшение', 'рефакторинг', 'качество кода', 'ошибки'
  ],
  
  'Debugging': [
    'debug', 'fix', 'error', 'bug', 'troubleshoot', 'solve', 'problem', 'issue',
    'exception', 'crash', 'failure', 'отладка', 'исправление', 'ошибка', 'баг',
    'проблема', 'решение', 'сбой', 'исключение', 'crash', 'не работает'
  ],
  
  'Content Creation': [
    'write', 'create', 'content', 'article', 'blog', 'post', 'story', 'text',
    'copywriting', 'marketing', 'social media', 'email', 'newsletter', 'description',
    'создание контента', 'написание', 'статья', 'блог', 'пост', 'текст', 'копирайтинг',
    'маркетинг', 'соцсети', 'описание', 'реклама', 'письмо'
  ],
  
  'Teaching': [
    'explain', 'teach', 'learn', 'tutorial', 'guide', 'education', 'training',
    'course', 'lesson', 'instruction', 'help', 'how to', 'step by step',
    'обучение', 'объяснение', 'урок', 'руководство', 'инструкция', 'помощь',
    'как сделать', 'пошагово', 'туториал', 'гайд', 'образование'
  ]
}

async function analyzeAndUpdatePrompts() {
  try {
    console.log('🔍 Начинаю анализ промптов...')
    
    // Получаем все промпты
    const prompts = await prisma.prompt.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        filters: true
      }
    })
    
    console.log(`📊 Найдено ${prompts.length} промптов для анализа`)
    
    let updatedCount = 0
    
    for (const prompt of prompts) {
      const newFilters = new Set(prompt.filters || [])
      const textToAnalyze = `${prompt.title} ${prompt.content}`.toLowerCase()
      
      // Проверяем каждый фильтр
      for (const [filterName, keywords] of Object.entries(filterKeywords)) {
        const hasKeyword = keywords.some(keyword => 
          textToAnalyze.includes(keyword.toLowerCase())
        )
        
        if (hasKeyword) {
          newFilters.add(filterName)
        }
      }
      
      // Обновляем только если есть изменения
      const currentFilters = new Set(prompt.filters || [])
      const hasChanges = newFilters.size !== currentFilters.size || 
        [...newFilters].some(filter => !currentFilters.has(filter))
      
      if (hasChanges) {
        await prisma.prompt.update({
          where: { id: prompt.id },
          data: { filters: Array.from(newFilters) }
        })
        
        updatedCount++
        console.log(`✅ Обновлен промпт "${prompt.title.substring(0, 50)}...": ${Array.from(newFilters).join(', ')}`)
      }
    }
    
    console.log(`🎉 Анализ завершен! Обновлено ${updatedCount} промптов из ${prompts.length}`)
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Запускаем анализ
analyzeAndUpdatePrompts()
