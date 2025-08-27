#!/bin/bash
# Production deployment script

echo "🚀 Подготовка к production deploy..."

# 1. Проверяем environment
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL не установлен"
    exit 1
fi

# 2. Генерируем Prisma клиент
echo "📦 Генерируем Prisma клиент..."
npx prisma generate

# 3. Синхронизируем схему БД
echo "🗄️ Синхронизируем БД..."
npx prisma db push --accept-data-loss

# 4. Собираем приложение
echo "🔨 Сборка приложения..."
npm run build

# 5. Запускаем
echo "▶️ Запуск production сервера..."
npm start
