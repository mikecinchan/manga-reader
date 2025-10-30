# MangaDex Hotlink Protection Fix

## Problem
MangaDex implements hotlink protection on their images:
1. **Cover images** (`https://uploads.mangadex.org/covers/...`)
2. **Chapter images** (MangaDex@Home servers with various domains)

When accessing the Netlify-deployed frontend, these images fail to load because direct links from external domains are blocked. Chapter pages displayed "You can read this at: https://mangadex.org/" instead of the actual manga pages.

## Solution
Implemented a **Netlify serverless function** that acts as an image proxy, fetching images server-side and serving them to the frontend. This bypasses hotlink protection for **both cover images AND chapter pages** while maintaining optimal performance.

---

## Implementation Details

### 1. Serverless Function
**File:** `frontend/netlify/functions/image-proxy.js`

- Accepts image URLs via query parameter: `/.netlify/functions/image-proxy?url=...`
- Validates URLs to ensure they're from MangaDex (both cover images and MangaDex@Home servers)
- Fetches images server-side with appropriate headers (User-Agent, Referer)
- Returns images as base64-encoded data with caching headers
- Implements error handling for failed requests

**Key Features:**
- Security: Only allows MangaDex URLs (covers + chapter images)
- Performance: Sets 1-year cache headers for browser caching
- Error handling: Graceful degradation on failures
- Supports: Cover images AND chapter images from MangaDex@Home network

### 2. Image Proxy Utility
**File:** `frontend/src/utils/imageProxy.js`

Helper function `getProxiedImageUrl()` that:
- In **development**: Returns direct URLs (works on localhost)
- In **production**: Proxies URLs through the Netlify function
- Automatically detects environment and applies appropriate transformation
- Handles both cover images (`uploads.mangadex.org`) and chapter images (MangaDex@Home servers)
- Uses regex pattern matching to identify MangaDex@Home URLs (`/data/` or `/data-saver/` paths)

### 3. Component Updates
Updated all components that display images:

**Cover Images:**
- **`MangaCard.jsx`** (Line 12): Search results grid
- **`MangaDetailsPage.jsx`** (Line 118): Manga details page
- **`BookmarksPage.jsx`** (Line 101): Bookmarks list

**Chapter Images:**
- **`ReaderPage.jsx`**: Chapter reader page
  - Line 352: Current page image display
  - Line 216: Image preloading (adjacent pages)
  - Line 241: Retry mechanism for failed images

All components now use `getProxiedImageUrl()` to transform URLs.

### 4. Configuration
**File:** `netlify.toml`

Added functions configuration:
```toml
[functions]
  directory = "netlify/functions/"
```

---

## How It Works

### Development (localhost)
```
Frontend → Direct request to MangaDex → Image loads ✓
```

### Production (Netlify)
```
Frontend → Netlify Function → MangaDex API → Netlify Function → Frontend → Image loads ✓
```

The serverless function acts as a trusted intermediary, making the request appear to come from the server rather than the user's browser.

---

## Testing

### Local Build Test
```bash
cd frontend
npm run build
```
✅ Build succeeded without errors

### Testing on Netlify
1. Push changes to your repository
2. Netlify will automatically rebuild and redeploy
3. Cover images should now load correctly on the deployed site

---

## Files Modified

### Created:
- `frontend/netlify/functions/image-proxy.js` - Serverless proxy function
- `frontend/src/utils/imageProxy.js` - URL transformation utility
- `HOTLINK_PROTECTION_FIX.md` - This documentation

### Modified (Phase 1 - Cover Images):
- `netlify.toml` - Added functions configuration
- `frontend/src/components/MangaCard.jsx` - Use proxied URLs for covers
- `frontend/src/pages/MangaDetailsPage.jsx` - Use proxied URLs for covers
- `frontend/src/pages/BookmarksPage.jsx` - Use proxied URLs for covers
- `backend/src/services/mangadex.js` - Added documentation comment

### Modified (Phase 2 - Chapter Images):
- `frontend/netlify/functions/image-proxy.js` - Extended to handle MangaDex@Home URLs
- `frontend/src/utils/imageProxy.js` - Enhanced detection for chapter images
- `frontend/src/pages/ReaderPage.jsx` - Use proxied URLs for chapter pages

---

## Performance Considerations

1. **Browser Caching**: Images are cached for 1 year with immutable headers
2. **Development Performance**: No proxying on localhost (direct URLs)
3. **Serverless Optimization**: Function uses streaming to stay within execution limits
4. **Complete Coverage**: Both cover images and chapter images are proxied for consistent behavior

---

## Security

✅ Only MangaDex URLs are allowed
✅ Validation prevents arbitrary URL proxying
✅ No sensitive data exposed
✅ CORS headers properly configured

---

## Deployment Checklist

### Phase 1 - Cover Images:
- [x] Create serverless function
- [x] Add image proxy utility
- [x] Update all components using cover images
- [x] Configure netlify.toml
- [x] Test local build
- [x] Deploy to Netlify
- [x] Verify cover images load on production site

### Phase 2 - Chapter Images:
- [x] Extend serverless function to handle MangaDex@Home URLs
- [x] Enhance image proxy utility for chapter image detection
- [x] Update ReaderPage.jsx to use proxied URLs
- [x] Test local build
- [x] Deploy to Netlify
- [x] Verify chapter pages load on production site

✅ **Status:** Implementation complete and verified in production

---

## Troubleshooting

### Images still not loading after deployment?

1. **Check function deployment:**
   - Visit: `https://your-site.netlify.app/.netlify/functions/image-proxy?url=https://uploads.mangadex.org/covers/test.jpg`
   - Should return an error about invalid URL or attempt to load

2. **Check browser console:**
   - Look for errors related to the proxy function
   - Verify URLs are being transformed correctly

3. **Verify environment:**
   - Ensure `NODE_ENV` is set to `production` in Netlify build settings
   - Check that functions directory is correctly configured

4. **Check Netlify function logs:**
   - Go to Netlify Dashboard > Functions tab
   - Review logs for the `image-proxy` function

### Function timeout errors?

The function has a 10-second timeout for fetching images. If images are very large:
- Consider reducing quality in the backend
- Implement retry logic
- Add loading states in the frontend

---

## Future Enhancements

Potential improvements for the image proxy:

1. **CDN Caching**: Add Netlify Edge caching for faster repeat requests
2. **Image Optimization**: Resize/compress images on-the-fly using Sharp
3. **Fallback Images**: Serve placeholder images on failures
4. **Rate Limiting**: Prevent abuse of the proxy function
5. **Analytics**: Track image request patterns

---

## References

- [MangaDex API Documentation](https://api.mangadex.org/docs/)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Reference Implementation](https://github.com/danielasakpa/Netlify-Serverless-Manga-Proxy)

---

## Production Verification

✅ **Deployment Date:** 2025-10-30
✅ **Production URL:** https://mangadex-reader.netlify.app/
✅ **Status:** Implementation complete and verified

### Test Results:
- ✅ Cover images loading correctly on search results
- ✅ Cover images loading correctly on manga details page
- ✅ Cover images loading correctly on bookmarks page
- ✅ Chapter pages loading correctly in reader
- ✅ Image preloading working in chapter reader
- ✅ Image retry mechanism functioning properly
- ✅ No "You can read this at mangadex.org" blocking messages
- ✅ Browser caching working as expected

---

**Status:** ✅ Implementation complete and production verified
