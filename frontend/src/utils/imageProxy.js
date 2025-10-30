/**
 * Image Proxy Utility
 * Handles proxying of MangaDex images to bypass hotlink protection
 *
 * Proxies both:
 * - Cover images from uploads.mangadex.org
 * - Chapter images from MangaDex@Home servers
 *
 * In development: Uses direct URLs (works on localhost)
 * In production: Proxies through Netlify serverless function
 */

/**
 * Converts a direct MangaDex image URL to a proxied URL for production
 * @param {string} imageUrl - The original MangaDex image URL
 * @returns {string} - Proxied URL for production or original URL for development
 */
export function getProxiedImageUrl(imageUrl) {
  // If no URL provided, return null
  if (!imageUrl) return null;

  // In development (localhost), use direct URLs - they work fine
  if (process.env.NODE_ENV === 'development') {
    return imageUrl;
  }

  // In production, proxy through Netlify serverless function
  // Proxy all MangaDex-related URLs:
  // 1. Cover images: https://uploads.mangadex.org/covers/...
  // 2. Chapter images from MangaDex@Home: various servers with /data/ or /data-saver/ paths
  const isMangaDexUrl =
    imageUrl.startsWith('https://uploads.mangadex.org/') ||
    imageUrl.includes('mangadex.org') ||
    imageUrl.match(/https?:\/\/[^/]+\/data(-saver)?\/[a-f0-9]+\//);

  if (isMangaDexUrl) {
    const encodedUrl = encodeURIComponent(imageUrl);
    return `/.netlify/functions/image-proxy?url=${encodedUrl}`;
  }

  // For any other URLs, return as-is
  return imageUrl;
}

/**
 * Preloads an image and returns a promise
 * Useful for checking if an image can be loaded
 * @param {string} url - Image URL to preload
 * @returns {Promise} - Resolves when image loads, rejects on error
 */
export function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}
