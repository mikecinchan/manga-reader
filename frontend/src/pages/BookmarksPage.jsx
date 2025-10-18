import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookmarksAPI } from '../services/api';
import { getProxiedImageUrl } from '../utils/imageProxy';
import { FaTrash } from 'react-icons/fa';
import '../styles/BookmarksPage.css';

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadBookmarks();
  }, []);

  async function loadBookmarks() {
    try {
      setLoading(true);
      setError('');
      const response = await bookmarksAPI.getAll();
      setBookmarks(response.data);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      setError('Failed to load bookmarks. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(bookmarkId, e) {
    e.stopPropagation();

    if (!window.confirm('Remove this bookmark?')) {
      return;
    }

    try {
      await bookmarksAPI.delete(bookmarkId);
      setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      alert('Failed to remove bookmark. Please try again.');
    }
  }

  function handleContinueReading(bookmark) {
    navigate(`/reader/${bookmark.chapterId}`, {
      state: {
        mangaId: bookmark.mangaId,
        mangaTitle: bookmark.mangaTitle,
      },
    });
  }

  function handleViewManga(mangaId) {
    navigate(`/manga/${mangaId}`);
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (loading) {
    return <div className="loading">Loading bookmarks...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={loadBookmarks} className="btn-retry">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bookmarks-page">
      <h1>My Bookmarks</h1>

      {bookmarks.length === 0 ? (
        <div className="no-bookmarks">
          <p>No bookmarks yet.</p>
          <p>Start reading manga and bookmark chapters to continue later!</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Browse Manga
          </button>
        </div>
      ) : (
        <div className="bookmarks-grid">
          {bookmarks.map((bookmark) => {
            const proxiedCoverUrl = getProxiedImageUrl(bookmark.coverUrl);
            return (
              <div key={bookmark.id} className="bookmark-card">
                <div
                  className="bookmark-cover"
                  onClick={() => handleViewManga(bookmark.mangaId)}
                >
                  {proxiedCoverUrl ? (
                    <img src={proxiedCoverUrl} alt={bookmark.mangaTitle} />
                  ) : (
                    <div className="no-cover">No Cover</div>
                  )}
                </div>

              <div className="bookmark-info">
                <h3
                  className="bookmark-title"
                  onClick={() => handleViewManga(bookmark.mangaId)}
                >
                  {bookmark.mangaTitle}
                </h3>

                <p className="bookmark-chapter">
                  Chapter {bookmark.chapterNumber}
                  {bookmark.chapterTitle && `: ${bookmark.chapterTitle}`}
                </p>

                <p className="bookmark-date">
                  Last read: {formatDate(bookmark.lastReadAt)}
                </p>

                <div className="bookmark-actions">
                  <button
                    onClick={() => handleContinueReading(bookmark)}
                    className="btn-continue"
                  >
                    Continue Reading
                  </button>

                  <button
                    onClick={(e) => handleDelete(bookmark.id, e)}
                    className="btn-delete"
                    title="Remove bookmark"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BookmarksPage;
