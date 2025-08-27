-- SQL индексы для улучшения производительности Supabase
-- Скопируйте и запустите в Supabase SQL Editor

-- Индекс для фильтрации по категории (GPT, Claude, и т.д.)
CREATE INDEX IF NOT EXISTS idx_prompt_category ON "Prompt"(category);

-- Индекс для сортировки по дате создания (новые сначала)
CREATE INDEX IF NOT EXISTS idx_prompt_created_at ON "Prompt"("createdAt" DESC);

-- Индекс для фильтрации по цене (бесплатные/платные)
CREATE INDEX IF NOT EXISTS idx_prompt_price_sol ON "Prompt"("priceSol");

-- Индекс для поиска промптов по владельцу
CREATE INDEX IF NOT EXISTS idx_prompt_owner ON "Prompt"(owner);

-- Составной индекс для комбинированных запросов (категория + дата)
CREATE INDEX IF NOT EXISTS idx_prompt_category_created_at ON "Prompt"(category, "createdAt" DESC);

-- Индекс для массива фильтров (GIN индекс для эффективного поиска в массивах)
CREATE INDEX IF NOT EXISTS idx_prompt_filters ON "Prompt" USING GIN (filters);

-- Показать созданные индексы
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename = 'Prompt' 
ORDER BY indexname;
