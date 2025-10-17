const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const mangadexService = require('../services/mangadex');

/**
 * GET /api/manga/search
 * Search manga with advanced filters
 */
router.get('/search', verifyAuth, async (req, res, next) => {
  try {
    const {
      title,
      limit = 20,
      offset = 0,
      includedTags,
      excludedTags,
      status,
      publicationDemographic,
      contentRating,
      order,
    } = req.query;

    // Build query parameters
    const params = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      'availableTranslatedLanguage[]': ['en'], // Only manga with English translations available
      includes: ['cover_art', 'author', 'artist'],
    };

    if (title) params.title = title;
    if (includedTags) {
      const tags = Array.isArray(includedTags) ? includedTags : [includedTags];
      params['includedTags[]'] = tags;
    }
    if (excludedTags) {
      const tags = Array.isArray(excludedTags) ? excludedTags : [excludedTags];
      params['excludedTags[]'] = tags;
    }
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      params['status[]'] = statuses;
    }
    if (publicationDemographic) {
      const demographics = Array.isArray(publicationDemographic)
        ? publicationDemographic
        : [publicationDemographic];
      params['publicationDemographic[]'] = demographics;
    }
    if (contentRating) {
      const ratings = Array.isArray(contentRating) ? contentRating : [contentRating];
      params['contentRating[]'] = ratings;
    }
    if (order) {
      params.order = JSON.parse(order);
    }

    const data = await mangadexService.searchManga(params);

    // Transform response to include cover URLs
    const results = data.data.map((manga) => {
      const coverArt = manga.relationships.find((rel) => rel.type === 'cover_art');
      const author = manga.relationships.find((rel) => rel.type === 'author');
      const artist = manga.relationships.find((rel) => rel.type === 'artist');

      // Debug logging
      if (coverArt) {
        console.log(`[Manga ${manga.id}] Cover art:`, {
          fileName: coverArt.attributes?.fileName,
          hasFileName: !!coverArt.attributes?.fileName,
          coverArtKeys: Object.keys(coverArt),
          attributesKeys: coverArt.attributes ? Object.keys(coverArt.attributes) : 'no attributes'
        });
      } else {
        console.log(`[Manga ${manga.id}] No cover art found in relationships`);
      }

      return {
        id: manga.id,
        ...manga.attributes,
        coverUrl: coverArt
          ? mangadexService.getCoverUrl(manga.id, coverArt.attributes?.fileName, '512')
          : null,
        author: author?.attributes?.name || 'Unknown',
        artist: artist?.attributes?.name || 'Unknown',
      };
    });

    res.json({
      data: results,
      limit: data.limit,
      offset: data.offset,
      total: data.total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/manga/:id
 * Get manga details by ID
 */
router.get('/:id', verifyAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await mangadexService.getMangaById(id);

    const manga = data.data;
    const coverArt = manga.relationships.find((rel) => rel.type === 'cover_art');
    const author = manga.relationships.find((rel) => rel.type === 'author');
    const artist = manga.relationships.find((rel) => rel.type === 'artist');

    const result = {
      id: manga.id,
      ...manga.attributes,
      coverUrl: coverArt
        ? mangadexService.getCoverUrl(manga.id, coverArt.attributes.fileName, 'original')
        : null,
      author: author?.attributes?.name || 'Unknown',
      artist: artist?.attributes?.name || 'Unknown',
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/manga/:id/feed
 * Get manga chapters
 */
router.get('/:id/feed', verifyAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      limit = 100,
      offset = 0,
      order = '{"chapter":"desc"}',
      translatedLanguage = 'en',
    } = req.query;

    const params = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      'translatedLanguage[]': translatedLanguage,
      includes: ['scanlation_group'],
      order: JSON.parse(order),
    };

    const data = await mangadexService.getMangaFeed(id, params);

    // Transform response
    const chapters = data.data.map((chapter) => {
      const scanlationGroup = chapter.relationships.find(
        (rel) => rel.type === 'scanlation_group'
      );

      return {
        id: chapter.id,
        ...chapter.attributes,
        scanlationGroup: scanlationGroup?.attributes?.name || 'Unknown',
      };
    });

    res.json({
      data: chapters,
      limit: data.limit,
      offset: data.offset,
      total: data.total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/manga/tags
 * Get all available tags
 */
router.get('/tags/all', verifyAuth, async (req, res, next) => {
  try {
    const data = await mangadexService.getTags();

    const tags = data.data.map((tag) => ({
      id: tag.id,
      name: tag.attributes.name,
      group: tag.attributes.group,
    }));

    res.json(tags);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
