-- Проверка совместимости и добавление недостающих полей
-- Выполните эти команды в вашей БД, если полей нет

-- 1. Если у вас priceUSD, а нужно priceSol - добавляем новое поле
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "priceSol" REAL DEFAULT 0;

-- 2. Если нужно, копируем данные из priceUSD в priceSol (1 USD ≈ 6 SOL на примере)
-- UPDATE "Prompt" SET "priceSol" = "priceUSD" * 6 WHERE "priceSol" = 0;

-- 3. Убеждаемся, что все нужные поля есть
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "buyers" TEXT[] DEFAULT '{}';
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "filters" TEXT[] DEFAULT '{}';

-- 4. Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS "idx_prompt_category" ON "Prompt"("category");
CREATE INDEX IF NOT EXISTS "idx_prompt_owner" ON "Prompt"("owner");
CREATE INDEX IF NOT EXISTS "idx_prompt_created" ON "Prompt"("createdAt");

-- 5. Проверяем структуру
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Prompt' 
ORDER BY ordinal_position;
