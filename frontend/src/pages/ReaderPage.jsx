import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { chapterAPI, bookmarksAPI } from '../services/api';
import {
  getCachedChapter,
  cacheChapter,
  isChapterCached,
} from '../services/offlineCache';
import { FaBookmark, FaDownload, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../styles/ReaderPage.css';

function ReaderPage() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chapter, setChapter] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [caching, setCaching] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [preloadedImages, setPreloadedImages] = useState(new Set());

  const imageRefs = useRef([]);
  const hideControlsTimeout = useRef(null);

  // State from navigation
  const mangaId = location.state?.mangaId;
  const mangaTitle = location.state?.mangaTitle;

  useEffect(() => {
    loadChapter();
    checkIfCached();

    // Reset controls timeout
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [chapterId]);

  useEffect(() => {
    // Keyboard navigation
    function handleKeyPress(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePreviousPage();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, images.length]);

  useEffect(() => {
    // Preload adjacent images
    if (images.length > 0) {
      preloadAdjacentImages();
    }
  }, [currentPage, images]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    resetControlsTimeout();
  }, [showControls]);

  async function loadChapter() {
    try {
      setLoading(true);
      setError('');

      // Try to load from cache first
      const cached = await getCachedChapter(chapterId);

      if (cached) {
        console.log('Loading chapter from cache');
        setImages(cached.images);
        setIsCached(true);
      } else {
        // Fetch from API
        const [chapterResponse, imagesResponse] = await Promise.all([
          chapterAPI.getById(chapterId),
          chapterAPI.getImages(chapterId, 'data'),
        ]);

        setChapter(chapterResponse.data);
        setImages(imagesResponse.data.images);
      }
    } catch (error) {
      console.error('Failed to load chapter:', error);
      setError('Failed to load chapter. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function checkIfCached() {
    const cached = await isChapterCached(chapterId);
    setIsCached(cached);
  }

  async function handleCacheChapter() {
    try {
      setCaching(true);
      const success = await cacheChapter(chapterId, images);

      if (success) {
        setIsCached(true);
        alert('Chapter cached for offline reading!');
      } else {
        alert('Failed to cache chapter. Please try again.');
      }
    } catch (error) {
      console.error('Error caching chapter:', error);
      alert('Failed to cache chapter.');
    } finally {
      setCaching(false);
    }
  }

  async function handleBookmark() {
    try {
      if (!mangaId) {
        alert('Cannot bookmark: manga information missing');
        return;
      }

      await bookmarksAPI.create({
        mangaId,
        mangaTitle: mangaTitle || 'Unknown',
        coverUrl: null,
        chapterId,
        chapterNumber: chapter?.chapter || 'Unknown',
        chapterTitle: chapter?.title || '',
        totalPages: images.length,
      });

      alert('Chapter bookmarked!');
    } catch (error) {
      console.error('Error bookmarking:', error);
      alert('Failed to bookmark chapter.');
    }
  }

  function handleNextPage() {
    if (currentPage < images.length - 1) {
      setCurrentPage(currentPage + 1);
      scrollToTop();
      showControlsTemporarily();
    }
  }

  function handlePreviousPage() {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      scrollToTop();
      showControlsTemporarily();
    }
  }

  function handlePageClick(e) {
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;

    // Click on left side = previous, right side = next
    if (clickX < screenWidth / 2) {
      handlePreviousPage();
    } else {
      handleNextPage();
    }
  }

  function handleClose() {
    if (mangaId) {
      navigate(`/manga/${mangaId}`);
    } else {
      navigate(-1);
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showControlsTemporarily() {
    setShowControls(true);
    resetControlsTimeout();
  }

  function resetControlsTimeout() {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }

    hideControlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }

  function preloadAdjacentImages() {
    const pagesToPreload = [currentPage + 1, currentPage + 2, currentPage + 3];

    pagesToPreload.forEach((pageNum) => {
      if (pageNum < images.length && !preloadedImages.has(pageNum)) {
        const img = new Image();
        img.src = images[pageNum].url;
        img.onload = () => {
          setPreloadedImages((prev) => new Set([...prev, pageNum]));
        };
      }
    });
  }

  function handleImageError(pageIndex) {
    console.error(`Failed to load image at page ${pageIndex + 1}`);
    setImageLoadErrors((prev) => ({ ...prev, [pageIndex]: true }));
  }

  function retryLoadImage(pageIndex) {
    setImageLoadErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[pageIndex];
      return newErrors;
    });

    // Force reload the image
    if (imageRefs.current[pageIndex]) {
      const img = imageRefs.current[pageIndex];
      img.src = images[pageIndex].url + '?retry=' + Date.now();
    }
  }

  // Touch gesture handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextPage,
    onSwipedRight: handlePreviousPage,
    preventScrollOnSwipe: false,
    trackMouse: false,
  });

  if (loading) {
    return (
      <div className="reader-loading">
        <div className="loading-spinner"></div>
        <p>Loading chapter...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reader-error">
        <p>{error}</p>
        <button onClick={handleClose} className="btn-close-error">
          Go Back
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="reader-error">
        <p>No images found for this chapter.</p>
        <button onClick={handleClose} className="btn-close-error">
          Go Back
        </button>
      </div>
    );
  }

  const currentImage = images[currentPage];
  const hasError = imageLoadErrors[currentPage];

  return (
    <div
      className="reader-page"
      {...swipeHandlers}
      onMouseMove={showControlsTemporarily}
      onClick={handlePageClick}
    >
      {/* Top Controls */}
      <div className={`reader-controls top ${showControls ? 'visible' : ''}`}>
        <button onClick={handleClose} className="btn-control" title="Close reader">
          <FaTimes />
        </button>

        <div className="reader-info">
          {mangaTitle && <span className="manga-title-header">{mangaTitle}</span>}
          {chapter && <span className="chapter-title">Ch. {chapter.chapter}</span>}
        </div>

        <div className="reader-actions">
          {!isCached && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCacheChapter();
              }}
              className="btn-control"
              disabled={caching}
              title="Download for offline"
            >
              <FaDownload />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBookmark();
            }}
            className="btn-control"
            title="Bookmark this chapter"
          >
            <FaBookmark />
          </button>
        </div>
      </div>

      {/* Image Display */}
      <div className="reader-image-container">
        {hasError ? (
          <div className="image-error">
            <p>Failed to load image</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                retryLoadImage(currentPage);
              }}
              className="btn-retry"
            >
              Retry
            </button>
          </div>
        ) : (
          <img
            ref={(el) => (imageRefs.current[currentPage] = el)}
            src={currentImage.url}
            alt={`Page ${currentPage + 1}`}
            className="reader-image"
            onError={() => handleImageError(currentPage)}
          />
        )}
      </div>

      {/* Bottom Controls */}
      <div className={`reader-controls bottom ${showControls ? 'visible' : ''}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePreviousPage();
          }}
          disabled={currentPage === 0}
          className="btn-nav"
        >
          <FaChevronLeft /> Previous
        </button>

        <div className="page-indicator">
          Page {currentPage + 1} / {images.length}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNextPage();
          }}
          disabled={currentPage === images.length - 1}
          className="btn-nav"
        >
          Next <FaChevronRight />
        </button>
      </div>

      {/* Page Navigation Hint */}
      <div className={`navigation-hint ${showControls ? 'visible' : ''}`}>
        <div className="hint-left">← Previous</div>
        <div className="hint-right">Next →</div>
      </div>
    </div>
  );
}

export default ReaderPage;
