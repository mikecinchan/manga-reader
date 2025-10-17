const axios = require('axios');
const NodeCache = require('node-cache');

const BASE_URL = process.env.MANGADEX_API_BASE_URL || 'https://api.mangadex.org';
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS) || 300; // 5 minutes

// Initialize cache
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// Create axios instance with default config
const mangadexAPI = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for logging
mangadexAPI.interceptors.request.use(
  (config) => {
    console.log(`MangaDex API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
mangadexAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('MangaDex API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('MangaDex API Error: No response received');
    } else {
      console.error('MangaDex API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Search manga with filters
 */
async function searchManga(params) {
  const cacheKey = `search_${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log('Returning cached search results');
    return cached;
  }

  const response = await mangadexAPI.get('/manga', { params });
  cache.set(cacheKey, response.data);
  return response.data;
}

/**
 * Get manga details by ID
 */
async function getMangaById(id, includes = ['cover_art', 'author', 'artist']) {
  const cacheKey = `manga_${id}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log('Returning cached manga details');
    return cached;
  }

  const response = await mangadexAPI.get(`/manga/${id}`, {
    params: { includes }
  });
  cache.set(cacheKey, response.data);
  return response.data;
}

/**
 * Get manga feed (chapters)
 */
async function getMangaFeed(mangaId, params) {
  const cacheKey = `feed_${mangaId}_${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log('Returning cached manga feed');
    return cached;
  }

  const response = await mangadexAPI.get(`/manga/${mangaId}/feed`, { params });
  cache.set(cacheKey, response.data);
  return response.data;
}

/**
 * Get chapter details by ID
 */
async function getChapterById(id, includes = ['scanlation_group', 'manga', 'user']) {
  const cacheKey = `chapter_${id}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log('Returning cached chapter details');
    return cached;
  }

  const response = await mangadexAPI.get(`/chapter/${id}`, {
    params: { includes }
  });
  cache.set(cacheKey, response.data);
  return response.data;
}

/**
 * Get chapter images from MangaDex@Home
 */
async function getChapterImages(chapterId) {
  const cacheKey = `images_${chapterId}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log('Returning cached chapter images');
    return cached;
  }

  const response = await mangadexAPI.get(`/at-home/server/${chapterId}`);
  cache.set(cacheKey, response.data);
  return response.data;
}

/**
 * Get cover art URL
 * MangaDex cover images are served from uploads.mangadex.org
 * Format: https://uploads.mangadex.org/covers/{mangaId}/{fileName}
 * The fileName already includes the extension (usually .jpg or .png)
 */
function getCoverUrl(mangaId, fileName, quality = '512') {
  if (!fileName) return null;

  // For MangaDex, the fileName already contains the full filename with extension
  // We just need to construct the URL - no quality variants are needed
  // The original file is the only version available
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
}

/**
 * Get available tags
 */
async function getTags() {
  const cacheKey = 'tags_all';
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log('Returning cached tags');
    return cached;
  }

  const response = await mangadexAPI.get('/manga/tag');
  cache.set(cacheKey, response.data, 3600); // Cache tags for 1 hour
  return response.data;
}

/**
 * Clear cache for specific key or all cache
 */
function clearCache(key = null) {
  if (key) {
    cache.del(key);
  } else {
    cache.flushAll();
  }
}

module.exports = {
  searchManga,
  getMangaById,
  getMangaFeed,
  getChapterById,
  getChapterImages,
  getCoverUrl,
  getTags,
  clearCache
};
