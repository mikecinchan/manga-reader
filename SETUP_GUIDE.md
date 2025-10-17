# MangaDex Reader - Setup Guide

This guide will walk you through setting up the MangaDex Reader application from scratch.

## Table of Contents
1. [Firebase Setup](#firebase-setup)
2. [Local Development Setup](#local-development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Running the Application](#running-the-application)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "mangadex-reader")
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click "Get Started"
3. Click on "Email/Password" under Sign-in providers
4. Enable "Email/Password"
5. Click "Save"

### Step 3: Create Firestore Database

1. In Firebase Console, go to **Build > Firestore Database**
2. Click "Create database"
3. Select "Start in production mode"
4. Choose a location closest to your users
5. Click "Enable"

### Step 4: Configure Firestore Security Rules

1. In Firestore Database, go to the "Rules" tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Bookmarks collection
    match /bookmarks/{bookmarkId} {
      // Users can only read/write their own bookmarks
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Click "Publish"

### Step 5: Get Web App Credentials

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (</>) to add a web app
4. Register app (e.g., "MangaDex Reader Web")
5. Copy the `firebaseConfig` object values:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

### Step 6: Generate Service Account Key (for Backend)

1. In Firebase Console, go to **Project Settings > Service Accounts**
2. Click "Generate new private key"
3. Click "Generate key" - a JSON file will download
4. Save this file as `serviceAccountKey.json`
5. **IMPORTANT**: Keep this file secure and never commit it to Git

---

## Local Development Setup

### Prerequisites

Make sure you have installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

### Step 1: Install Dependencies

Open terminal/command prompt and navigate to the project directory:

```bash
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

---

## Environment Configuration

### Frontend Configuration

1. Navigate to the `frontend` directory
2. Create a `.env` file by copying the example:

**Windows (Command Prompt):**
```cmd
cd frontend
copy .env.example .env
```

**Mac/Linux:**
```bash
cd frontend
cp .env.example .env
```

3. Open `frontend/.env` in a text editor
4. Fill in your Firebase credentials from Step 5 above:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

### Backend Configuration

1. Navigate to `backend/config` directory and create it if it doesn't exist:

**Windows:**
```cmd
cd ..\backend
mkdir config
```

**Mac/Linux:**
```bash
cd ../backend
mkdir -p config
```

2. Copy the `serviceAccountKey.json` file (from Firebase Step 6) into `backend/config/`:

```
backend/
  config/
    serviceAccountKey.json  ← Place it here
```

3. The `backend/.env` file is already created with default values. Verify it exists and contains:

```env
PORT=5000
NODE_ENV=development
FIREBASE_SERVICE_ACCOUNT_PATH=./config/serviceAccountKey.json
MANGADEX_API_BASE_URL=https://api.mangadex.org
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
CACHE_TTL_SECONDS=300
```

---

## Running the Application

### Option 1: Run Everything at Once (Recommended)

From the root `Mangadex` directory:

```bash
npm run dev
```

This will start both frontend and backend servers:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### First Time Setup

1. Open your browser and go to http://localhost:3000
2. Click "Sign Up" to create a new account
3. Enter your email and password (minimum 6 characters)
4. After signing up, you'll be automatically logged in
5. Start browsing and reading manga!

---

## Deployment

### Deploying Frontend to Netlify

1. **Prepare your repository:**
   - Create a GitHub repository
   - Push your code to GitHub

2. **Deploy to Netlify:**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Authorize GitHub and select your repository
   - Configure build settings:
     - **Base directory**: `frontend`
     - **Build command**: `npm run build`
     - **Publish directory**: `frontend/build`

3. **Add environment variables in Netlify:**
   - Go to Site settings > Build & deploy > Environment
   - Add all `REACT_APP_*` variables from your `.env` file

4. **Deploy!**
   - Click "Deploy site"
   - Your site will be live at `https://your-site-name.netlify.app`

### Deploying Backend

#### Option A: Heroku

```bash
cd backend
heroku create your-app-name
heroku config:set NODE_ENV=production

# Add service account key as config
# (For Heroku, you may need to encode it as base64 or use a secrets manager)

git add .
git commit -m "Deploy backend"
git push heroku main
```

#### Option B: Railway

1. Go to [Railway.app](https://railway.app)
2. Create a new project from GitHub repo
3. Set root directory to `backend`
4. Add environment variables
5. Upload `serviceAccountKey.json` securely

### Update Frontend to Use Production Backend

After deploying your backend, update the frontend API URL:

1. Create `frontend/.env.production`:

```env
REACT_APP_API_URL=https://your-backend-url.herokuapp.com/api
```

2. Update `frontend/src/services/api.js`:

```javascript
baseURL: process.env.REACT_APP_API_URL || '/api',
```

---

## Troubleshooting

### Issue: Firebase errors on startup

**Solution:**
- Check that all environment variables in `frontend/.env` are correct
- Ensure there are no extra spaces or quotes
- Restart the development server after changing `.env` files

### Issue: Backend can't connect to Firebase

**Solution:**
- Verify `serviceAccountKey.json` is in `backend/config/`
- Check that the file is valid JSON
- Ensure Firebase Admin SDK is initialized correctly

### Issue: "Failed to load manga"

**Solution:**
- Check that the backend server is running on port 5000
- Open http://localhost:5000/health in your browser - should return `{"status":"OK"}`
- Check browser console for specific error messages

### Issue: Images not loading in reader

**Solution:**
- This is usually due to MangaDex API rate limiting
- Wait a few seconds and try again
- Check browser console for CORS errors

### Issue: Bookmarks not working

**Solution:**
- Ensure Firestore security rules are set correctly
- Check that user is authenticated (look for user email in navbar)
- Check browser console for permission denied errors

### Issue: Module not found errors

**Solution:**
```bash
# Clean install
cd frontend
rm -rf node_modules package-lock.json
npm install

cd ../backend
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port already in use

**Solution:**

**Windows:**
```cmd
# Find process using port 3000 or 5000
netstat -ano | findstr :3000
# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or for port 5000
lsof -ti:5000 | xargs kill -9
```

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [MangaDex API Documentation](https://api.mangadex.org/docs/)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)
- [Netlify Documentation](https://docs.netlify.com/)

---

## Getting Help

If you encounter issues not covered here:

1. Check the browser console for error messages
2. Check the backend terminal for error logs
3. Verify all environment variables are set correctly
4. Make sure all dependencies are installed
5. Try clearing browser cache and restarting servers

For additional support, please open an issue on GitHub.

---

**Congratulations! Your MangaDex Reader should now be up and running!**

Happy reading! 📚
