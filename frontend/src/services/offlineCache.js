import localforage from 'localforage';

// Configure localforage instances
const chapterCache = localforage.createInstance({
  name: 'mangadex-reader',
  storeName: 'chapters',
  description: 'Cached chapter images for offline reading',
});

const metadataCache = localforage.createInstance({
  name: 'mangadex-reader',
  storeName: 'metadata',
  description: 'Cached manga and chapter metadata',
});

/**
 * Cache chapter images for offline reading
 */
export async function cacheChapter(chapterId, images) {
  try {
    // Fetch and convert images to blobs
    const imageBlobs = await Promise.all(
      images.map(async (img) => {
        try {
          const response = await fetch(img.url);
          const blob = await response.blob();
          return {
            fileName: img.fileName,
            blob,
            url: img.url,
          };
        } catch (error) {
          console.error(`Failed to cache image ${img.fileName}:`, error);
          return null;
        }
      })
    );

    // Filter out failed images
    const validImages = imageBlobs.filter((img) => img !== null);

    // Store in IndexedDB
    await chapterCache.setItem(chapterId, {
      images: validImages,
      cachedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Error caching chapter:', error);
    return false;
  }
}

/**
 * Get cached chapter images
 */
export async function getCachedChapter(chapterId) {
  try {
    const cached = await chapterCache.getItem(chapterId);

    if (!cached) return null;

    // Convert blobs back to URLs
    const images = cached.images.map((img) => ({
      fileName: img.fileName,
      url: URL.createObjectURL(img.blob),
      originalUrl: img.url,
      cached: true,
    }));

    return {
      images,
      cachedAt: cached.cachedAt,
    };
  } catch (error) {
    console.error('Error retrieving cached chapter:', error);
    return null;
  }
}

/**
 * Check if chapter is cached
 */
export async function isChapterCached(chapterId) {
  try {
    const keys = await chapterCache.keys();
    return keys.includes(chapterId);
  } catch (error) {
    console.error('Error checking cache:', error);
    return false;
  }
}

/**
 * Remove cached chapter
 */
export async function removeCachedChapter(chapterId) {
  try {
    await chapterCache.removeItem(chapterId);
    return true;
  } catch (error) {
    console.error('Error removing cached chapter:', error);
    return false;
  }
}

/**
 * Get all cached chapter IDs
 */
export async function getCachedChapterIds() {
  try {
    return await chapterCache.keys();
  } catch (error) {
    console.error('Error getting cached chapters:', error);
    return [];
  }
}

/**
 * Clear all cached chapters
 */
export async function clearAllCachedChapters() {
  try {
    await chapterCache.clear();
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}

/**
 * Get cache size estimation
 */
export async function getCacheSize() {
  try {
    const keys = await chapterCache.keys();
    let totalSize = 0;

    for (const key of keys) {
      const item = await chapterCache.getItem(key);
      if (item && item.images) {
        for (const img of item.images) {
          totalSize += img.blob.size;
        }
      }
    }

    return {
      chapters: keys.length,
      sizeBytes: totalSize,
      sizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    };
  } catch (error) {
    console.error('Error calculating cache size:', error);
    return { chapters: 0, sizeBytes: 0, sizeMB: '0.00' };
  }
}

/**
 * Cache manga metadata
 */
export async function cacheMangaMetadata(mangaId, data) {
  try {
    await metadataCache.setItem(`manga_${mangaId}`, {
      ...data,
      cachedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error caching manga metadata:', error);
    return false;
  }
}

/**
 * Get cached manga metadata
 */
export async function getCachedMangaMetadata(mangaId) {
  try {
    return await metadataCache.getItem(`manga_${mangaId}`);
  } catch (error) {
    console.error('Error retrieving manga metadata:', error);
    return null;
  }
}

export default {
  cacheChapter,
  getCachedChapter,
  isChapterCached,
  removeCachedChapter,
  getCachedChapterIds,
  clearAllCachedChapters,
  getCacheSize,
  cacheMangaMetadata,
  getCachedMangaMetadata,
};
