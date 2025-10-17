# MangaDex Reader

A modern, feature-rich manga reading application built with React and Node.js that leverages the MangaDex API for manga content, with Firebase for user authentication and bookmarks.

## Features

### Core Features
- **Search Manga**: Search through thousands of manga titles with English language filtering
- **Advanced Filters**: Filter by tags, genres, publication status, demographics, and content ratings
- **Manga Details**: View comprehensive information including cover art, description, author, tags, and status
- **Chapter Management**: Browse and sort chapters by number or date
- **Bookmarks**: Save your reading progress to continue later (synced across devices)

### Reader Features
- **Single-Page Reader**: Clean, distraction-free reading experience
- **Keyboard Navigation**: Use arrow keys to navigate between pages
- **Touch Gestures**: Swipe left/right on mobile devices to change pages
- **Image Preloading**: Smooth reading with intelligent preloading of next pages
- **Error Handling**: Automatic retry mechanism for failed image loads
- **Auto-hide Controls**: Controls fade away for immersive reading

### Offline Features
- **Chapter Caching**: Download chapters for offline reading
- **IndexedDB Storage**: Efficient storage using localforage
- **Cache Management**: View cached chapters and manage storage

### Design
- **Mobile-First**: Optimized for mobile devices with responsive design
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Dark Reader**: Reading mode with dark background for comfortable viewing

## Tech Stack

### Frontend
- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Firebase**: Authentication and Firestore database
- **Localforage**: Offline chapter caching (IndexedDB)
- **Axios**: HTTP client for API calls
- **React Icons**: Icon library
- **React Swipeable**: Touch gesture support

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **Firebase Admin**: Server-side Firebase operations
- **Node-Cache**: In-memory caching for API responses
- **Helmet**: Security headers
- **Express Rate Limit**: API rate limiting

### Deployment
- **Netlify**: Frontend hosting (recommended)
- **Any Node.js host**: Backend hosting (Heroku, Railway, etc.)

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Firebase account
- MangaDex API access (free, no key required)

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** > Email/Password sign-in method
4. Create a **Firestore Database** (start in production mode)
5. Set Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookmarks/{bookmarkId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

6. Get your web app credentials:
   - Go to Project Settings > Your apps > Add app > Web
   - Copy the Firebase configuration

7. Download Service Account Key (for backend):
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save as `backend/config/serviceAccountKey.json`

### 2. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Mangadex

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Configuration

#### Frontend Configuration

Create `frontend/.env`:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

#### Backend Configuration

The `backend/.env` file is already created with default values. Ensure your Firebase service account key is placed at `backend/config/serviceAccountKey.json`.

### 4. Running the Application

#### Development Mode

From the root directory:

```bash
# Run both frontend and backend concurrently
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Frontend (runs on http://localhost:3000)
cd frontend
npm start

# Terminal 2 - Backend (runs on http://localhost:5000)
cd backend
npm run dev
```

#### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

## Deployment

### Frontend (Netlify)

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com) and sign in
3. Click "New site from Git"
4. Select your repository
5. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
6. Add environment variables in Netlify dashboard (all REACT_APP_* variables)
7. Deploy!

The `netlify.toml` file is already configured with the correct settings.

### Backend

Deploy to any Node.js hosting platform:

**Heroku:**
```bash
cd backend
heroku create your-app-name
heroku config:set NODE_ENV=production
# Upload serviceAccountKey.json securely
git push heroku main
```

**Railway/Render:**
- Connect your GitHub repository
- Set root directory to `backend`
- Add environment variables
- Upload service account key through their file system

### Update Frontend API Base URL

After deploying the backend, update the frontend to point to your backend URL:

In `frontend/src/services/api.js`, change:
```javascript
baseURL: '/api',  // Development
```
to:
```javascript
baseURL: 'https://your-backend-url.com/api',  // Production
```

Or use environment variables:
```javascript
baseURL: process.env.REACT_APP_API_URL || '/api',
```

## Usage

1. **Create an Account**: Sign up with email and password
2. **Search for Manga**: Use the search bar and filters to find manga
3. **Read Chapters**: Click on a manga to see chapters, then click to read
4. **Bookmark**: While reading, click the bookmark button to save your progress
5. **Offline Reading**: Click the download button in the reader to cache chapters
6. **Continue Reading**: Access bookmarked chapters from the Bookmarks page

## Keyboard Shortcuts (Reader)

- `→` or `↓`: Next page
- `←` or `↑`: Previous page
- `Esc`: Close reader

## Mobile Gestures (Reader)

- **Swipe Left**: Next page
- **Swipe Right**: Previous page
- **Tap Left Side**: Previous page
- **Tap Right Side**: Next page

## Project Structure

```
Mangadex/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChapterList.jsx
│   │   │   ├── MangaCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── SearchFilters.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── BookmarksPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── MangaDetailsPage.jsx
│   │   │   ├── ReaderPage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── firebase.js
│   │   │   └── offlineCache.js
│   │   ├── styles/
│   │   │   └── [CSS files]
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── firebase.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── bookmarks.js
│   │   │   ├── chapter.js
│   │   │   └── manga.js
│   │   ├── services/
│   │   │   └── mangadex.js
│   │   └── server.js
│   └── package.json
├── netlify.toml
└── README.md
```

## Error Handling

The application includes comprehensive error handling:

- **Image Loading**: Automatic retry mechanism with user-friendly error messages
- **API Failures**: Graceful degradation with error notifications
- **Authentication**: Clear error messages for login/signup issues
- **Network Issues**: Offline support with cached content

## Security

- Firebase authentication with secure token management
- Protected routes requiring authentication
- Backend API with token verification
- Rate limiting on backend endpoints
- Security headers with Helmet
- CORS configuration

## Performance Optimizations

- Image lazy loading on manga cards
- Intelligent preloading in chapter reader
- API response caching (5-minute TTL)
- Compression middleware
- Optimized bundle size

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Acknowledgments

- [MangaDex](https://mangadex.org/) for providing the API
- [Firebase](https://firebase.google.com/) for authentication and database
- [React](https://reactjs.org/) for the amazing framework

## Support

For issues and questions, please open an issue on GitHub.

## Future Enhancements

- [ ] Reading history tracking
- [ ] Reading statistics
- [ ] Multiple reading modes (vertical scroll, double page)
- [ ] Custom themes
- [ ] Chapter auto-mark as read
- [ ] Push notifications for new chapters
- [ ] Social features (ratings, reviews)
- [ ] Reading lists/collections
