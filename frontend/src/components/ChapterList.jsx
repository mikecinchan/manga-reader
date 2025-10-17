import React, { useState } from 'react';
import { FaBookmark, FaDownload, FaCheck } from 'react-icons/fa';
import { isChapterCached } from '../services/offlineCache';
import '../styles/ChapterList.css';

function ChapterList({ chapters, onChapterClick, currentBookmark }) {
  const [cachedChapters, setCachedChapters] = useState(new Set());

  React.useEffect(() => {
    checkCachedChapters();
  }, [chapters]);

  async function checkCachedChapters() {
    const cached = new Set();
    for (const chapter of chapters) {
      const isCached = await isChapterCached(chapter.id);
      if (isCached) {
        cached.add(chapter.id);
      }
    }
    setCachedChapters(cached);
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

  function groupChaptersByVolume(chapters) {
    const grouped = {};

    chapters.forEach((chapter) => {
      const volume = chapter.volume || 'No Volume';
      if (!grouped[volume]) {
        grouped[volume] = [];
      }
      grouped[volume].push(chapter);
    });

    return grouped;
  }

  const groupedChapters = groupChaptersByVolume(chapters);

  return (
    <div className="chapter-list">
      {Object.entries(groupedChapters).map(([volume, volumeChapters]) => (
        <div key={volume} className="volume-group">
          <h3 className="volume-header">Volume {volume}</h3>

          {volumeChapters.map((chapter) => {
            const isBookmarked = currentBookmark?.chapterId === chapter.id;
            const isCached = cachedChapters.has(chapter.id);

            return (
              <div
                key={chapter.id}
                className={`chapter-item ${isBookmarked ? 'bookmarked' : ''}`}
                onClick={() => onChapterClick(chapter)}
              >
                <div className="chapter-main">
                  <div className="chapter-number">
                    Ch. {chapter.chapter || '?'}
                    {isBookmarked && <FaBookmark className="bookmark-icon" />}
                  </div>
                  <div className="chapter-details">
                    {chapter.title && (
                      <div className="chapter-title">{chapter.title}</div>
                    )}
                    <div className="chapter-meta">
                      <span className="scanlation-group">{chapter.scanlationGroup}</span>
                      {chapter.publishAt && (
                        <>
                          <span className="separator">•</span>
                          <span className="publish-date">
                            {formatDate(chapter.publishAt)}
                          </span>
                        </>
                      )}
                      {chapter.pages && (
                        <>
                          <span className="separator">•</span>
                          <span className="page-count">{chapter.pages} pages</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="chapter-icons">
                  {isCached && (
                    <FaDownload className="download-icon cached" title="Cached for offline" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default ChapterList;
