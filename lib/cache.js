// Простое кеширование в памяти для категорий и фильтров
let categoriesCache = null;
let categoriesCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

export function getCachedCategories() {
  if (categoriesCache && (Date.now() - categoriesCacheTime) < CACHE_DURATION) {
    return categoriesCache;
  }
  return null;
}

export function setCachedCategories(categories) {
  categoriesCache = categories;
  categoriesCacheTime = Date.now();
}

export function clearCache() {
  categoriesCache = null;
  categoriesCacheTime = 0;
}
