import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mangaAPI, bookmarksAPI } from '../services/api';
import ChapterList from '../components/ChapterList';
import '../styles/MangaDetailsPage.css';

function MangaDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [error, setError] = useState('');
  const [bookmark, setBookmark] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // desc = newest first

  useEffect(() => {
    loadMangaDetails();
    loadChapters();
    checkBookmark();
  }, [id]);

  async function loadMangaDetails() {
    try {
      setLoading(true);
      setError('');
      const response = await mangaAPI.getById(id);
      setManga(response.data);
    } catch (error) {
      console.error('Failed to load manga:', error);
      setError('Failed to load manga details. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadChapters() {
    try {
      setLoadingChapters(true);
      const response = await mangaAPI.getFeed(id, {
        limit: 500,
        offset: 0,
        order: JSON.stringify({ chapter: sortOrder }),
        translatedLanguage: 'en',
      });
      setChapters(response.data.data);
    } catch (error) {
      console.error('Failed to load chapters:', error);
    } finally {
      setLoadingChapters(false);
    }
  }

  async function checkBookmark() {
    try {
      const response = await bookmarksAPI.checkManga(id);
      if (response.data.bookmarked) {
        setBookmark(response.data.bookmark);
      }
    } catch (error) {
      console.error('Failed to check bookmark:', error);
    }
  }

  function handleSortChange() {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    loadChapters();
  }

  function handleChapterClick(chapter) {
    navigate(`/reader/${chapter.id}`, {
      state: { mangaId: id, mangaTitle: getTitle(manga?.title) },
    });
  }

  function getTitle(titleObj) {
    if (!titleObj) return 'Unknown';
    return titleObj.en || titleObj['ja-ro'] || titleObj[Object.keys(titleObj)[0]] || 'Unknown';
  }

  function getDescription(descObj) {
    if (!descObj) return 'No description available.';
    return descObj.en || descObj[Object.keys(descObj)[0]] || 'No description available.';
  }

  if (loading) {
    return <div className="loading">Loading manga details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-back">
          Go Back
        </button>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="error-container">
        <p>Manga not found</p>
        <button onClick={() => navigate(-1)} className="btn-back">
          Go Back
        </button>
      </div>
    );
  }

  const displayTitle = getTitle(manga.title);
  const description = getDescription(manga.description);

  return (
    <div className="manga-details-page">
      <button onClick={() => navigate(-1)} className="btn-back-inline">
        ← Back
      </button>

      <div className="manga-header">
        <div className="manga-cover-large">
          {manga.coverUrl ? (
            <img src={manga.coverUrl} alt={displayTitle} />
          ) : (
            <div className="no-cover-large">No Cover</div>
          )}
        </div>

        <div className="manga-header-info">
          <h1>{displayTitle}</h1>

          <div className="manga-meta-info">
            <p>
              <strong>Author:</strong> {manga.author}
            </p>
            <p>
              <strong>Artist:</strong> {manga.artist}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={`status-badge ${manga.status}`}>{manga.status}</span>
            </p>
            <p>
              <strong>Content Rating:</strong>{' '}
              <span className={`rating-badge ${manga.contentRating}`}>
                {manga.contentRating}
              </span>
            </p>
            {manga.publicationDemographic && (
              <p>
                <strong>Demographic:</strong> {manga.publicationDemographic}
              </p>
            )}
            {manga.year && (
              <p>
                <strong>Year:</strong> {manga.year}
              </p>
            )}
          </div>

          {manga.tags && manga.tags.length > 0 && (
            <div className="manga-tags">
              <strong>Tags:</strong>
              <div className="tags-list">
                {manga.tags.slice(0, 15).map((tag) => (
                  <span key={tag.id} className="tag">
                    {tag.attributes?.name?.en || tag.attributes?.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {bookmark && (
            <div className="continue-reading">
              <p>Continue reading from Chapter {bookmark.chapterNumber}</p>
              <button
                onClick={() => handleChapterClick({ id: bookmark.chapterId })}
                className="btn-continue"
              >
                Continue Reading
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="manga-description">
        <h2>Description</h2>
        <p>{description}</p>
      </div>

      <div className="chapters-section">
        <div className="chapters-header">
          <h2>Chapters ({chapters.length})</h2>
          <button onClick={handleSortChange} className="btn-sort">
            Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>

        {loadingChapters ? (
          <div className="loading">Loading chapters...</div>
        ) : chapters.length === 0 ? (
          <p className="no-chapters">No English chapters available.</p>
        ) : (
          <ChapterList
            chapters={chapters}
            onChapterClick={handleChapterClick}
            currentBookmark={bookmark}
          />
        )}
      </div>
    </div>
  );
}

export default MangaDetailsPage;
