import React, { useState, useEffect } from 'react';
import { mangaAPI } from '../services/api';
import '../styles/SearchFilters.css';

const PUBLICATION_DEMOGRAPHICS = [
  { value: 'shounen', label: 'Shounen' },
  { value: 'shoujo', label: 'Shoujo' },
  { value: 'seinen', label: 'Seinen' },
  { value: 'josei', label: 'Josei' },
];

const STATUS_OPTIONS = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'hiatus', label: 'Hiatus' },
  { value: 'cancelled', label: 'Cancelled' },
];

const CONTENT_RATINGS = [
  { value: 'safe', label: 'Safe' },
  { value: 'suggestive', label: 'Suggestive' },
  { value: 'erotica', label: 'Erotica' },
  { value: 'pornographic', label: 'Pornographic' },
];

function SearchFilters({ filters, onFilterChange, onApply }) {
  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  async function loadTags() {
    try {
      setLoadingTags(true);
      const response = await mangaAPI.getTags();
      setTags(response.data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoadingTags(false);
    }
  }

  function handleTagToggle(tagId, type) {
    const updatedFilters = { ...localFilters };

    if (type === 'include') {
      const included = new Set(updatedFilters.includedTags);
      const excluded = new Set(updatedFilters.excludedTags);

      if (included.has(tagId)) {
        included.delete(tagId);
      } else {
        included.add(tagId);
        excluded.delete(tagId); // Remove from excluded if adding to included
      }

      updatedFilters.includedTags = Array.from(included);
      updatedFilters.excludedTags = Array.from(excluded);
    } else {
      const included = new Set(updatedFilters.includedTags);
      const excluded = new Set(updatedFilters.excludedTags);

      if (excluded.has(tagId)) {
        excluded.delete(tagId);
      } else {
        excluded.add(tagId);
        included.delete(tagId); // Remove from included if adding to excluded
      }

      updatedFilters.includedTags = Array.from(included);
      updatedFilters.excludedTags = Array.from(excluded);
    }

    setLocalFilters(updatedFilters);
  }

  function handleCheckboxChange(category, value) {
    const updatedFilters = { ...localFilters };
    const currentValues = new Set(updatedFilters[category]);

    if (currentValues.has(value)) {
      currentValues.delete(value);
    } else {
      currentValues.add(value);
    }

    updatedFilters[category] = Array.from(currentValues);
    setLocalFilters(updatedFilters);
  }

  function handleApply() {
    onFilterChange(localFilters);
    onApply();
  }

  function handleReset() {
    const resetFilters = {
      includedTags: [],
      excludedTags: [],
      status: [],
      contentRating: ['safe', 'suggestive'],
      publicationDemographic: [],
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  }

  // Group tags by category
  const tagsByGroup = tags.reduce((acc, tag) => {
    const group = tag.group || 'other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(tag);
    return {};
  }, {});

  return (
    <div className="search-filters">
      <div className="filter-section">
        <h3>Publication Status</h3>
        <div className="filter-options">
          {STATUS_OPTIONS.map((option) => (
            <label key={option.value} className="checkbox-label">
              <input
                type="checkbox"
                checked={localFilters.status.includes(option.value)}
                onChange={() => handleCheckboxChange('status', option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3>Demographics</h3>
        <div className="filter-options">
          {PUBLICATION_DEMOGRAPHICS.map((option) => (
            <label key={option.value} className="checkbox-label">
              <input
                type="checkbox"
                checked={localFilters.publicationDemographic.includes(option.value)}
                onChange={() =>
                  handleCheckboxChange('publicationDemographic', option.value)
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3>Content Rating</h3>
        <div className="filter-options">
          {CONTENT_RATINGS.map((option) => (
            <label key={option.value} className="checkbox-label">
              <input
                type="checkbox"
                checked={localFilters.contentRating.includes(option.value)}
                onChange={() => handleCheckboxChange('contentRating', option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3>Tags</h3>
        {loadingTags ? (
          <p>Loading tags...</p>
        ) : (
          <div className="tags-container">
            {tags.slice(0, 30).map((tag) => {
              const isIncluded = localFilters.includedTags.includes(tag.id);
              const isExcluded = localFilters.excludedTags.includes(tag.id);

              return (
                <div key={tag.id} className="tag-item">
                  <span className="tag-name">{tag.name.en || tag.name}</span>
                  <div className="tag-buttons">
                    <button
                      onClick={() => handleTagToggle(tag.id, 'include')}
                      className={`tag-btn ${isIncluded ? 'active-include' : ''}`}
                      title="Include this tag"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleTagToggle(tag.id, 'exclude')}
                      className={`tag-btn ${isExcluded ? 'active-exclude' : ''}`}
                      title="Exclude this tag"
                    >
                      −
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="filter-actions">
        <button onClick={handleReset} className="btn-reset">
          Reset Filters
        </button>
        <button onClick={handleApply} className="btn-apply">
          Apply Filters
        </button>
      </div>
    </div>
  );
}

export default SearchFilters;
