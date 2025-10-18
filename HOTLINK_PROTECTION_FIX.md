# MangaDex Hotlink Protection Fix

## Problem
MangaDex implements hotlink protection on their cover images (`https://uploads.mangadex.org/covers/...`). When accessing the Netlify-deployed frontend, cover images fail to load because direct links from external domains are blocked.

## Solution
Implemented a **Netlify serverless function** that acts as an image proxy, fetching images server-side and serving them to the frontend. This bypasses hotlink protection while maintaining optimal performance.

---

## Implementation Details

### 1. Serverless Function
**File:** `frontend/netlify/functions/image-proxy.js`

- Accepts image URLs via query parameter: `/.netlify/functions/image-proxy?url=...`
- Validates URLs to ensure they're from MangaDex only
- Fetches images server-side with appropriate headers (User-Agent, Referer)
- Returns images as base64-encoded data with caching headers
- Implements error handling for failed requests

**Key Features:**
- Security: Only allows MangaDex URLs
- Performance: Sets 1-year cache headers for browser caching
- Error handling: Graceful degradation on failures

### 2. Image Proxy Utility
**File:** `frontend/src/utils/imageProxy.js`

Helper function `getProxiedImageUrl()` that:
- In **development**: Returns direct URLs (works on localhost)
- In **production**: Proxies URLs through the Netlify function
- Automatically detects environment and applies appropriate transformation

### 3. Component Updates
Updated all components that display cover images:

- **`MangaCard.jsx`** (Line 12): Search results grid
- **`MangaDetailsPage.jsx`** (Line 118): Manga details page
- **`BookmarksPage.jsx`** (Line 101): Bookmarks list

All now use `getProxiedImageUrl()` to transform cover URLs.

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

### Modified:
- `netlify.toml` - Added functions configuration
- `frontend/src/components/MangaCard.jsx` - Use proxied URLs
- `frontend/src/pages/MangaDetailsPage.jsx` - Use proxied URLs
- `frontend/src/pages/BookmarksPage.jsx` - Use proxied URLs
- `backend/src/services/mangadex.js` - Added documentation comment

---

## Performance Considerations

1. **Browser Caching**: Images are cached for 1 year with immutable headers
2. **Development Performance**: No proxying on localhost (direct URLs)
3. **Serverless Optimization**: Function uses streaming to stay within execution limits
4. **Minimal Overhead**: Only cover images are proxied, chapter images use MangaDex@Home

---

## Security

✅ Only MangaDex URLs are allowed
✅ Validation prevents arbitrary URL proxying
✅ No sensitive data exposed
✅ CORS headers properly configured

---

## Deployment Checklist

- [x] Create serverless function
- [x] Add image proxy utility
- [x] Update all components using cover images
- [x] Configure netlify.toml
- [x] Test local build
- [ ] Deploy to Netlify
- [ ] Verify images load on production site

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

**Status:** ✅ Implementation complete, ready for deployment
