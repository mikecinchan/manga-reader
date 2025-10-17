import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mangaAPI } from '../services/api';
import MangaCard from '../components/MangaCard';
import SearchFilters from '../components/SearchFilters';
import '../styles/HomePage.css';

function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mangaList, setMangaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    includedTags: [],
    excludedTags: [],
    status: [],
    contentRating: ['safe', 'suggestive'],
    publicationDemographic: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Initial load - fetch popular manga
    handleSearch();
  }, []);

  async function handleSearch(offset = 0) {
    try {
      setLoading(true);
      setError('');

      const params = {
        limit: pagination.limit,
        offset,
        order: JSON.stringify({ followedCount: 'desc' }),
        ...filters,
      };

      if (searchQuery.trim()) {
        params.title = searchQuery.trim();
      }

      const response = await mangaAPI.search(params);

      setMangaList(response.data.data);
      setPagination({
        ...pagination,
        offset,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to load manga. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
  }

  function handleApplyFilters() {
    handleSearch(0);
    setShowFilters(false);
  }

  function handleNextPage() {
    const newOffset = pagination.offset + pagination.limit;
    if (newOffset < pagination.total) {
      handleSearch(newOffset);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handlePreviousPage() {
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    handleSearch(newOffset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="home-page">
      <div className="search-section">
        <h1>Discover Manga</h1>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search manga titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(0)}
          />
          <button onClick={() => handleSearch(0)} className="btn-search">
            Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-filters"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <SearchFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onApply={handleApplyFilters}
          />
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && <div className="loading">Loading manga...</div>}

      {!loading && mangaList.length === 0 && (
        <div className="no-results">
          <p>No manga found. Try adjusting your search or filters.</p>
        </div>
      )}

      {!loading && mangaList.length > 0 && (
        <>
          <div className="manga-grid">
            {mangaList.map((manga) => (
              <MangaCard
                key={manga.id}
                manga={manga}
                onClick={() => navigate(`/manga/${manga.id}`)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={handlePreviousPage}
                disabled={pagination.offset === 0}
                className="btn-page"
              >
                Previous
              </button>

              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={pagination.offset + pagination.limit >= pagination.total}
                className="btn-page"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HomePage;
