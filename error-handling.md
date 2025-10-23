# Error Handling Documentation

This document catalogs all errors encountered during development of the MangaDex Reader application, along with their solutions and preventive measures.

---

## Table of Contents
1. [Backend Configuration Errors](#backend-configuration-errors)
2. [Frontend Build & Configuration Errors](#frontend-build--configuration-errors)
3. [API Integration Errors](#api-integration-errors)
4. [Authentication & Authorization Errors](#authentication--authorization-errors)
5. [Best Practices & Prevention](#best-practices--prevention)

---

## Backend Configuration Errors

### Error 1: Firebase Service Account Key Not Found

**Error Message:**
```
Error: Cannot find module './src/config/serviceAccountKey.json'
Require stack:
- C:\Users\USER\Desktop\Projects\Mangadex\backend\src\config\firebase.js
```

**Symptoms:**
- Backend server fails to start
- Firebase Admin SDK initialization fails
- Error occurs immediately on server startup

**Root Cause:**
The service account key file was placed at `backend/src/config/serviceAccountKey.json`, but the code was trying to load it using an environment variable path that didn't properly resolve the relative path.

**Original Code (INCORRECT):**
```javascript
// backend/src/config/firebase.js
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
```

**Solution:**
Use `__dirname` to get the absolute path to the service account key file located in the same directory as the firebase.js file.

**Fixed Code:**
```javascript
// backend/src/config/firebase.js
const admin = require('firebase-admin');
const path = require('path');

// Use __dirname to get absolute path to serviceAccountKey.json
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  console.log('Please ensure serviceAccountKey.json is placed in backend/src/config/');
}
```

**Related Files Updated:**
1. `backend/.env` - Updated path documentation:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./src/config/serviceAccountKey.json
   ```

2. `backend/.gitignore` - Updated to ignore correct path:
   ```
   src/config/serviceAccountKey.json
   ```

**Prevention:**
- Always use `__dirname` or `path.resolve()` for file paths in Node.js
- Avoid relying on environment variables for relative paths
- Add try-catch blocks with helpful error messages for file loading

---

## Frontend Build & Configuration Errors

### Error 2: Webpack Dev Server Invalid Configuration

**Error Message:**
```
Invalid options object. Dev Server has been initialized using an options object that does not match the API schema.
 - options.allowedHosts[0] should be a non-empty string.
    -> When set, the dev-server will only accept requests from hosts on the list.
```

**Symptoms:**
- Frontend fails to start with `npm start`
- Webpack dev server throws validation error
- Error occurs before React app can load

**Root Cause:**
Version incompatibility between `react-scripts` and `webpack-dev-server`. The default configuration in newer versions of react-scripts doesn't properly handle the `allowedHosts` option.

**Solution:**
Add explicit Webpack Dev Server configuration via environment variables in `frontend/.env`.

**Added Configuration:**
```env
# frontend/.env

# Webpack Dev Server configuration
WDS_SOCKET_HOST=localhost
WDS_SOCKET_PORT=3000
WDS_SOCKET_PATH=/ws
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

**What Each Setting Does:**
- `WDS_SOCKET_HOST`: Sets the hostname for WebSocket connections
- `WDS_SOCKET_PORT`: Sets the port for WebSocket connections (matches dev server port)
- `WDS_SOCKET_PATH`: Sets the path for WebSocket endpoint
- `DANGEROUSLY_DISABLE_HOST_CHECK`: Disables host checking (only for development)

**Security Note:**
`DANGEROUSLY_DISABLE_HOST_CHECK=true` should ONLY be used in development. Never use this in production builds deployed to Netlify.

**Prevention:**
- Keep `react-scripts` updated to latest stable version
- Use environment variables for webpack configuration instead of ejecting
- Document webpack configuration requirements in README

---

## API Integration Errors

### Error 3: MangaDex API Connection Timeout / ISP Blocking

**Error Message:**
```
AxiosError: timeout of 10000ms exceeded
Error: AxiosError: timeout of 10000ms exceeded
  at RedirectableRequest.handleRequestTimeout
MangaDex API Error: No response received
```

**Symptoms:**
- Frontend shows "Failed to load manga. Please try again."
- Backend logs show repeated timeout errors after 10 seconds
- Search functionality doesn't work
- All MangaDex API requests fail
- Console shows "API Error: 500" with timeout messages

**Root Cause:**
In some regions (particularly Indonesia and other countries with internet filtering), ISPs block access to MangaDex API using DNS filtering systems like "Internet Positif". When you try to access `api.mangadex.org`, the DNS is redirected to a filtering server (e.g., `internetpositif3.firstmedia.com`), causing all requests to timeout.

**How to Diagnose:**
1. Test connectivity to MangaDex API:
   ```bash
   curl -I https://api.mangadex.org/manga
   ```

2. Check DNS resolution:
   ```bash
   ping api.mangadex.org
   ```

3. If you see responses from domains like `internetpositif.com` or similar filtering servers, your ISP is blocking MangaDex.

**Solution 1: Use a VPN (Recommended - Easiest)**

Install and connect to a VPN service:

**Free VPN Options:**
- **Cloudflare WARP** (recommended): https://1.1.1.1/
  - Download and install WARP app
  - Toggle "Connected"
  - No configuration needed

- **ProtonVPN**: https://protonvpn.com/ (free tier available)
- **Windscribe**: https://windscribe.com/ (free 10GB/month)

**After connecting to VPN:**
1. Restart your backend server (stop and run `npm run dev` again)
2. Refresh the frontend
3. MangaDex API should now be accessible

**Solution 2: Change DNS Settings**

If you cannot use a VPN, try changing your DNS to bypass ISP filtering:

**Windows (via Command Prompt as Administrator):**
```cmd
# For Ethernet
netsh interface ip set dns "Ethernet" static 1.1.1.1
netsh interface ip add dns "Ethernet" 8.8.8.8 index=2

# For Wi-Fi
netsh interface ip set dns "Wi-Fi" static 1.1.1.1
netsh interface ip add dns "Wi-Fi" 8.8.8.8 index=2

# Flush DNS cache
ipconfig /flushdns
```

**Windows (via GUI):**
1. Open Control Panel → Network and Internet → Network Connections
2. Right-click your network adapter → Properties
3. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
4. Select "Use the following DNS server addresses":
   - Preferred DNS: `1.1.1.1` (Cloudflare)
   - Alternate DNS: `8.8.8.8` (Google)
5. Click OK
6. Open Command Prompt and run: `ipconfig /flushdns`
7. Restart your network adapter or reboot

**Mac/Linux:**
```bash
# Edit network settings and set DNS to:
# Primary: 1.1.1.1
# Secondary: 8.8.8.8

# Flush DNS cache (Mac)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Flush DNS cache (Linux)
sudo systemd-resolve --flush-caches
```

**Solution 3: Use a Proxy (Advanced)**

If you have access to a proxy server, you can configure the backend to use it. This requires modifying `backend/src/services/mangadex.js` to add proxy configuration to axios.

**Verification:**

After applying any solution, test with:
```bash
curl -I https://api.mangadex.org/manga
```

You should see:
```
HTTP/2 200
content-type: application/json
```

**Prevention:**
- Keep VPN installed for development in regions with internet filtering
- Consider using a cloud-based development environment
- Deploy backend to a cloud provider (Railway, Heroku) that isn't affected by regional restrictions
- Document this requirement in README for developers in affected regions

**Related Error Messages:**
- `ECONNABORTED`
- `timeout of 10000ms exceeded`
- `No response received`
- DNS resolving to `internetpositif` or similar filtering domains

---

### Error 4: MangaDex Cover Images Not Loading

**Error Message:**
```
(failed) net::ERR_FAILED
Status: (failed)
Type: Other
Initiator: img
```

**Symptoms:**
- Manga list displays correctly with titles, authors, and metadata
- Cover images do not appear on HomePage (showing blank/broken images)
- Cover images DO load correctly on MangaDetailsPage
- Browser Network tab shows failed requests for image URLs ending in `.512.jpg`
- All cover image requests return network errors

**Root Cause:**
The `getCoverUrl` function was incorrectly constructing MangaDex cover image URLs by appending quality suffixes (`.512.jpg`) to filenames that already had extensions. MangaDex cover images:

1. Already include the complete filename with extension from the API (e.g., `d3e909b9-c667-48a5-beec-ac96f23fa228.jpg`)
2. Do not use quality variants in the URL path
3. The correct format is simply: `https://uploads.mangadex.org/covers/{mangaId}/{fileName}`

**Original Code (INCORRECT):**
```javascript
// backend/src/services/mangadex.js
function getCoverUrl(mangaId, fileName, quality = 'medium') {
  if (!fileName) return null;

  // WRONG: Trying to append quality suffix
  if (quality === 'original') {
    return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
  }

  // WRONG: Stripping extension and adding .512.jpg
  const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileNameWithoutExt}.${quality}.jpg`;
}
```

**Generated URLs (INCORRECT):**
```
https://uploads.mangadex.org/covers/a1c7c817-4e59-43b7-9365-09675a149a6f/d3e909b9-c667-48a5-beec-ac96f23fa228.512.jpg
❌ Returns 404/Network Error
```

**Fixed Code:**
```javascript
// backend/src/services/mangadex.js
/**
 * Get cover art URL
 * MangaDex cover images are served from uploads.mangadex.org
 * Format: https://uploads.mangadex.org/covers/{mangaId}/{fileName}
 * The fileName already includes the extension (usually .jpg or .png)
 */
function getCoverUrl(mangaId, fileName, quality = '512') {
  if (!fileName) return null;

  // For MangaDex, the fileName already contains the full filename with extension
  // We just need to construct the URL - no quality variants are needed
  // The original file is the only version available
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
}
```

**Generated URLs (CORRECT):**
```
https://uploads.mangadex.org/covers/a1c7c817-4e59-43b7-9365-09675a149a6f/d3e909b9-c667-48a5-beec-ac96f23fa228.jpg
✓ Loads successfully
```

**Additional Issue - Backend Cache:**
After fixing the code, the backend cache was still serving old responses with incorrect cover URLs. The cache had to be manually cleared.

**Cache Clearing Solution:**
```bash
# Added cache clearing endpoint (development only)
curl -X POST http://localhost:5000/api/cache/clear
```

**Backend Cache Clear Endpoint:**
```javascript
// backend/src/server.js
// Clear cache endpoint (development only)
app.post('/api/cache/clear', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Cache clearing is only available in development' });
  }
  mangadexService.clearCache();
  res.json({ message: 'Cache cleared successfully' });
});
```

**How to Debug Similar Issues:**
1. Open Browser DevTools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Filter by "Img" or "Images"
5. Look for failed image requests (red status indicators)
6. Click on a failed request to see the full URL
7. Copy the URL and test it directly in browser
8. Compare with MangaDex API documentation
9. Check if URL format matches expected pattern

**Why It Worked on Details Page:**
The manga details page uses `quality = 'original'` parameter, which in the original (incorrect) code had a different code path that happened to work correctly by not modifying the filename. The HomePage used `quality = '512'`, which triggered the incorrect filename manipulation logic.

**Prevention:**
- Always check API documentation for exact URL formats
- Test image URLs directly in browser before implementing
- Don't assume quality variants exist without verification
- Add image error handling in React components
- Log generated URLs during development for verification
- Clear caches after making URL generation changes

**Related Files Updated:**
1. `backend/src/services/mangadex.js` - Fixed `getCoverUrl` function
2. `backend/src/server.js` - Added cache clearing endpoint
3. `backend/src/routes/manga.js` - Uses correct cover URL generation

---

### Error 5: MangaDex API 400 - Invalid translatedLanguage Parameter

**Error Message:**
```
MangaDex API Error: 400
{
  "result": "error",
  "errors": [{
    "status": "400",
    "title": "Bad Request",
    "detail": "The property translatedLanguage is not defined and the definition does not allow additional properties"
  }]
}
```

**Symptoms:**
- User can log in successfully
- HomePage loads but shows no manga
- Browser console shows 400 error from `/api/manga/search`
- Network tab shows failed request to MangaDex API

**Root Cause:**
MangaDex API v5 uses **different parameter names** for different endpoints:
- **Manga search endpoint** (`/manga`) uses `availableTranslatedLanguage[]` to find manga that have translations available
- **Chapter feed endpoint** (`/manga/{id}/feed`) uses `translatedLanguage[]` to filter chapter translations

We were incorrectly using `translatedLanguage[]` for the manga search endpoint.

**Original Code (INCORRECT):**
```javascript
// backend/src/routes/manga.js - Line 28
const params = {
  limit: parseInt(limit),
  offset: parseInt(offset),
  'translatedLanguage[]': 'en', // WRONG - this parameter doesn't exist for manga search
  includes: ['cover_art', 'author', 'artist'],
};
```

**Fixed Code:**
```javascript
// backend/src/routes/manga.js - Line 28
const params = {
  limit: parseInt(limit),
  offset: parseInt(offset),
  'availableTranslatedLanguage[]': ['en'], // CORRECT - also changed to array format
  includes: ['cover_art', 'author', 'artist'],
};
```

**Key Changes:**
1. Parameter name: `translatedLanguage[]` → `availableTranslatedLanguage[]`
2. Value format: `'en'` → `['en']` (string to array)

**MangaDex API Parameter Reference:**

| Endpoint | Purpose | Parameter Name | Value Type |
|----------|---------|----------------|------------|
| `GET /manga` | Search manga | `availableTranslatedLanguage[]` | Array of language codes |
| `GET /manga/{id}/feed` | Get chapters | `translatedLanguage[]` | Array of language codes |

**Correct Implementation:**
```javascript
// Manga Search (backend/src/routes/manga.js)
router.get('/search', verifyAuth, async (req, res, next) => {
  const params = {
    'availableTranslatedLanguage[]': ['en'], // ✓ CORRECT
    includes: ['cover_art', 'author', 'artist'],
  };
  const data = await mangadexService.searchManga(params);
  // ...
});

// Chapter Feed (backend/src/routes/manga.js)
router.get('/:id/feed', verifyAuth, async (req, res, next) => {
  const params = {
    'translatedLanguage[]': translatedLanguage, // ✓ CORRECT for this endpoint
    includes: ['scanlation_group'],
  };
  const data = await mangadexService.getMangaFeed(id, params);
  // ...
});
```

**How to Debug Similar Issues:**
1. Check MangaDex API documentation at https://api.mangadex.org/docs.html
2. Look at the exact endpoint's parameter schema
3. Test API calls directly using tools like Postman or Thunder Client
4. Check backend console logs for detailed error messages
5. Enable request/response logging in `backend/src/services/mangadex.js`

**Prevention:**
- Always consult API documentation for parameter names
- Use TypeScript for better type safety
- Create API parameter interfaces/types
- Add request validation middleware
- Write integration tests for API calls

---

## Authentication & Authorization Errors

### Error 6: Firebase Authentication Not Enabled (Potential)

**Potential Error Message:**
```
Firebase: Error (auth/operation-not-allowed)
```

**Symptoms:**
- User cannot sign up or log in
- Firebase auth error in browser console
- Email/Password authentication fails

**Root Cause:**
Email/Password authentication method is not enabled in Firebase Console.

**Solution:**
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `manga-reader-5aa33`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Email/Password**
5. Enable both toggles:
   - ✓ Email/Password
   - ✓ Email link (passwordless sign-in) [optional]
6. Click **Save**

**Prevention:**
- Document Firebase setup steps in README
- Create setup checklist for new deployments
- Add better error messages in frontend for auth errors

---

### Error 7: Firestore Database Not Created (Potential)

**Potential Error Message:**
```
FirebaseError: 9 FAILED_PRECONDITION: The Cloud Firestore API is not available for Firestore in Datastore Mode.
```

**Symptoms:**
- Bookmarks cannot be saved
- Firestore queries fail
- Error when trying to access /api/bookmarks

**Root Cause:**
Firestore database has not been created in Firebase Console.

**Solution:**
1. Go to Firebase Console
2. Navigate to **Firestore Database**
3. Click **Create database**
4. Select location (e.g., `us-central` or closest to your users)
5. Start in **Production mode**
6. Set security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Bookmarks collection - users can only access their own bookmarks
    match /bookmarks/{bookmarkId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Prevention:**
- Add Firestore setup to deployment checklist
- Create setup script that checks for Firestore availability
- Add health check endpoint that verifies Firebase services

---

## Best Practices & Prevention

### 1. Environment Variable Management

**Best Practices:**
- Use `.env.example` files with dummy values
- Document all required environment variables
- Never commit actual `.env` files or service account keys
- Use `dotenv` package for loading environment variables
- Validate required environment variables on startup

**Example Validation:**
```javascript
// backend/src/config/validateEnv.js
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'MANGADEX_API_BASE_URL',
  'FIREBASE_SERVICE_ACCOUNT_PATH'
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});
```

---

### 2. Error Handling Patterns

**Backend Error Handling:**
```javascript
// Use async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Use in routes
router.get('/search', verifyAuth, asyncHandler(async (req, res) => {
  // Your code here
}));

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});
```

**Frontend Error Handling:**
```javascript
// API service with error handling
export const searchManga = async (params) => {
  try {
    const response = await api.get('/manga/search', { params });
    return response.data;
  } catch (error) {
    console.error('Search manga error:', error);

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    } else if (error.response?.status === 400) {
      throw new Error('Invalid search parameters');
    }

    throw error;
  }
};
```

---

### 3. Logging & Monitoring

**Backend Logging:**
```javascript
// backend/src/services/mangadex.js
api.interceptors.request.use((config) => {
  console.log(`[MangaDex API] ${config.method.toUpperCase()} ${config.url}`);
  console.log('[MangaDex API] Params:', config.params);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[MangaDex API] Response: ${response.status}`);
    return response;
  },
  (error) => {
    console.error('[MangaDex API] Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);
```

**What to Log:**
- ✓ API requests and responses (in development)
- ✓ Authentication attempts
- ✓ Database operations
- ✓ Error stack traces
- ✗ User passwords or sensitive data
- ✗ Complete Firebase service account keys

---

### 4. Testing Checklist

**Before Deployment:**
- [ ] All environment variables set correctly
- [ ] Firebase Authentication enabled (Email/Password)
- [ ] Firestore database created with security rules
- [ ] Service account key placed in correct location
- [ ] `.gitignore` properly configured
- [ ] Dependencies installed (`npm install` in all directories)
- [ ] Backend starts without errors (`npm run dev` in backend)
- [ ] Frontend starts without errors (`npm start` in frontend)
- [ ] Can sign up new user
- [ ] Can log in existing user
- [ ] Can search manga
- [ ] Can view manga details
- [ ] Can read chapters
- [ ] Can create bookmarks
- [ ] Can view bookmarks
- [ ] Can delete bookmarks
- [ ] Offline caching works
- [ ] Mobile responsive design works

---

### 5. Common Error Messages & Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| `Cannot find module './src/config/serviceAccountKey.json'` | Check file exists at `backend/src/config/serviceAccountKey.json` |
| `Webpack Dev Server invalid options` | Add WDS environment variables to `frontend/.env` |
| `timeout of 10000ms exceeded` / `MangaDex API timeout` | **Use VPN (Cloudflare WARP)** or change DNS to 1.1.1.1 - ISP blocking MangaDex |
| `Cover images not loading` | Check cover URL format, clear backend cache with `curl -X POST http://localhost:5000/api/cache/clear` |
| `MangaDex API 400 error` | Check API parameter names match documentation |
| `Firebase: Error (auth/operation-not-allowed)` | Enable Email/Password auth in Firebase Console |
| `CORS error` | Check backend CORS configuration allows frontend origin |
| `401 Unauthorized` | Check Firebase ID token is being sent in Authorization header |
| `Firebase Admin initialization failed` | Verify service account key is valid JSON |
| `Port 5000 already in use` | Kill existing process: `npx kill-port 5000` |
| `Port 3000 already in use` | Kill existing process: `npx kill-port 3000` |

---

### 6. Debugging Tools & Commands

**Check MangaDex API Connectivity:**
```bash
# Test if MangaDex API is accessible
curl -I https://api.mangadex.org/manga

# Check DNS resolution
ping api.mangadex.org

# If you see "internetpositif" or similar filtering domains, use VPN
```

**Check if ports are in use:**
```bash
# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Kill process by PID
taskkill /PID <PID> /F
```

**Test Backend API Directly:**
```bash
# Get auth token from browser DevTools → Application → Local Storage
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:5000/api/manga/search?title=naruto
```

**Check Firebase Admin SDK:**
```bash
# Add test route in backend
router.get('/test-firebase', async (req, res) => {
  try {
    const testDoc = await db.collection('test').doc('test').set({ test: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**React DevTools:**
- Install React Developer Tools browser extension
- Check component props and state
- Monitor AuthContext values

**Network Tab:**
- Check request headers (especially Authorization)
- Check request payload
- Check response status and body
- Look for failed requests

---

## Summary

This document will be updated as new errors are encountered and resolved. The key lessons learned:

1. **Always use absolute paths** for file operations in Node.js
2. **Read API documentation carefully** - parameter names matter
3. **Add proper error handling** at every layer (API, service, route, component)
4. **Log everything in development** to aid debugging
5. **Validate environment variables** on startup
6. **Write defensive code** with try-catch blocks and helpful error messages
7. **Test incrementally** - don't wait until everything is built
8. **Document setup steps** for future deployments

---

**Last Updated:** October 17, 2025
**Project:** MangaDex Reader Application
**Version:** 1.0.0
