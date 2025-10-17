const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const mangadexService = require('../services/mangadex');

/**
 * GET /api/chapter/:id
 * Get chapter details
 */
router.get('/:id', verifyAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await mangadexService.getChapterById(id);

    const chapter = data.data;
    const scanlationGroup = chapter.relationships.find(
      (rel) => rel.type === 'scanlation_group'
    );
    const manga = chapter.relationships.find((rel) => rel.type === 'manga');

    const result = {
      id: chapter.id,
      ...chapter.attributes,
      scanlationGroup: scanlationGroup?.attributes?.name || 'Unknown',
      mangaId: manga?.id || null,
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/chapter/:id/images
 * Get chapter images from MangaDex@Home
 */
router.get('/:id/images', verifyAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quality = 'data' } = req.query; // 'data' for normal, 'dataSaver' for compressed

    const data = await mangadexService.getChapterImages(id);

    // Build image URLs
    const baseUrl = data.baseUrl;
    const hash = data.chapter.hash;
    const imageFiles = quality === 'dataSaver'
      ? data.chapter.dataSaver
      : data.chapter.data;

    const imageUrls = imageFiles.map((fileName) => ({
      url: `${baseUrl}/${quality}/${hash}/${fileName}`,
      fileName,
    }));

    res.json({
      baseUrl,
      hash,
      images: imageUrls,
      totalPages: imageUrls.length,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
