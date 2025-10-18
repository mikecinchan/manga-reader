import React from 'react';
import { getProxiedImageUrl } from '../utils/imageProxy';
import '../styles/MangaCard.css';

function MangaCard({ manga, onClick }) {
  const { title, coverUrl, author, status, contentRating } = manga;

  // Get the first available title
  const displayTitle = title?.en || title?.['ja-ro'] || title?.[Object.keys(title)[0]] || 'Unknown Title';

  // Use proxied URL for production to bypass hotlink protection
  const proxiedCoverUrl = getProxiedImageUrl(coverUrl);

  return (
    <div className="manga-card" onClick={onClick}>
      <div className="manga-cover">
        {proxiedCoverUrl ? (
          <img src={proxiedCoverUrl} alt={displayTitle} loading="lazy" />
        ) : (
          <div className="no-cover">No Cover</div>
        )}
        <div className="manga-overlay">
          <span className="read-more">View Details</span>
        </div>
      </div>

      <div className="manga-info">
        <h3 className="manga-title" title={displayTitle}>
          {displayTitle}
        </h3>
        <p className="manga-author">{author}</p>
        <div className="manga-meta">
          {status && <span className={`status-badge ${status}`}>{status}</span>}
          {contentRating && (
            <span className={`rating-badge ${contentRating}`}>{contentRating}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default MangaCard;
