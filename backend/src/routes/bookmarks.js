const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const { db } = require('../config/firebase');

/**
 * GET /api/bookmarks
 * Get all bookmarks for authenticated user
 */
router.get('/', verifyAuth, async (req, res, next) => {
  try {
    const { uid } = req.user;

    const bookmarksRef = db.collection('bookmarks');
    const snapshot = await bookmarksRef
      .where('userId', '==', uid)
      .orderBy('lastReadAt', 'desc')
      .get();

    const bookmarks = [];
    snapshot.forEach((doc) => {
      bookmarks.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(bookmarks);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookmarks
 * Create a new bookmark
 */
router.post('/', verifyAuth, async (req, res, next) => {
  try {
    const { uid } = req.user;
    const {
      mangaId,
      mangaTitle,
      coverUrl,
      chapterId,
      chapterNumber,
      chapterTitle,
      totalPages,
    } = req.body;

    // Validation
    if (!mangaId || !chapterId) {
      return res.status(400).json({ error: 'mangaId and chapterId are required' });
    }

    // Check if bookmark already exists for this manga
    const existingBookmarkQuery = await db
      .collection('bookmarks')
      .where('userId', '==', uid)
      .where('mangaId', '==', mangaId)
      .get();

    let bookmarkRef;
    const bookmarkData = {
      userId: uid,
      mangaId,
      mangaTitle: mangaTitle || 'Unknown',
      coverUrl: coverUrl || null,
      chapterId,
      chapterNumber: chapterNumber || 'Unknown',
      chapterTitle: chapterTitle || '',
      totalPages: totalPages || 0,
      lastReadAt: new Date().toISOString(),
    };

    if (!existingBookmarkQuery.empty) {
      // Update existing bookmark
      const existingDoc = existingBookmarkQuery.docs[0];
      bookmarkRef = existingDoc.ref;
      await bookmarkRef.update(bookmarkData);
    } else {
      // Create new bookmark
      bookmarkRef = await db.collection('bookmarks').add(bookmarkData);
    }

    res.json({
      id: bookmarkRef.id,
      ...bookmarkData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/bookmarks/:id
 * Update a bookmark
 */
router.put('/:id', verifyAuth, async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const updates = req.body;

    const bookmarkRef = db.collection('bookmarks').doc(id);
    const doc = await bookmarkRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    // Verify ownership
    if (doc.data().userId !== uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await bookmarkRef.update({
      ...updates,
      lastReadAt: new Date().toISOString(),
    });

    const updatedDoc = await bookmarkRef.get();
    res.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/bookmarks/:id
 * Delete a bookmark
 */
router.delete('/:id', verifyAuth, async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    const bookmarkRef = db.collection('bookmarks').doc(id);
    const doc = await bookmarkRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    // Verify ownership
    if (doc.data().userId !== uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await bookmarkRef.delete();
    res.json({ message: 'Bookmark deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookmarks/manga/:mangaId
 * Check if manga is bookmarked
 */
router.get('/manga/:mangaId', verifyAuth, async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { mangaId } = req.params;

    const snapshot = await db
      .collection('bookmarks')
      .where('userId', '==', uid)
      .where('mangaId', '==', mangaId)
      .get();

    if (snapshot.empty) {
      return res.json({ bookmarked: false, bookmark: null });
    }

    const doc = snapshot.docs[0];
    res.json({
      bookmarked: true,
      bookmark: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
