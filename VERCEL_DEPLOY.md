# 🚀 Деплой на Vercel

## Настройка переменных окружения

1. **Зайдите в Vercel Dashboard** → ваш проект → **Settings** → **Environment Variables**

2. **Добавьте следующие переменные:**

```bash
DATABASE_URL = postgresql://postgres.delbmpkkbaxchritxjjx:SLOTH223SLOTH@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL = postgresql://postgres.delbmpkkbaxchritxjjx:SLOTH223SLOTH@aws-1-eu-north-1.pooler.supabase.com:5432/postgres

SEED_SECRET = e110a35f2054f447c79dbb7169b8f3dbdd5038dcb8235da986390b285893fe30

PAYOUT_WALLET = 7PCmkjiwhW8nQUVt8yJpxR1X9oSRJrbsBDpzxcQC8SoL

NEXT_PUBLIC_RPC_URL = https://dark-hardworking-bridge.solana-mainnet.quiknode.pro/326d9a4feaccfa1d9283e196753ea9727a4432f0
```

## 📋 Инструкции по деплою

1. **Откройте Vercel Dashboard**
2. **Settings** → **Environment Variables**
3. **Добавьте все переменные выше**
4. **Deployments** → **Redeploy** последний деплой

## ⚡ Быстрое решение

Если промпты не загружаются на Vercel:
- ✅ Проверьте переменные окружения
- ✅ Убедитесь что DATABASE_URL и DIRECT_URL добавлены
- ✅ Сделайте redeploy после добавления переменных

## 🗄️ База данных

- **Supabase**: 460 промптов в базе
- **Prisma**: автоматическая генерация клиента при билде
- **Подключение**: через pgbouncer (порт 6543)