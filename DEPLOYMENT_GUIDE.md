# Deployment Guide - MangaDex Reader Application

This guide will walk you through deploying your MangaDex Reader application to production.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Prepare and Push to GitHub](#step-1-prepare-and-push-to-github)
3. [Step 2: Deploy Backend to Railway](#step-2-deploy-backend-to-railway)
4. [Step 3: Deploy Frontend to Netlify](#step-3-deploy-frontend-to-netlify)
5. [Step 4: Configure Production Environment](#step-4-configure-production-environment)
6. [Step 5: Test Your Deployment](#step-5-test-your-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:

- [x] GitHub account (create at https://github.com)
- [x] Netlify account (create at https://netlify.com - can sign in with GitHub)
- [x] Railway account (create at https://railway.app - can sign in with GitHub) **OR** Render account (https://render.com)
- [x] Firebase project with:
  - Email/Password authentication enabled
  - Firestore database created
  - Service account key downloaded
- [x] Git installed on your machine
- [x] All code tested locally and working

---

## Step 1: Prepare and Push to GitHub

### 1.1 Verify .gitignore

Make sure your `.gitignore` file contains:
```
node_modules/
.env
*.log
.DS_Store

# Backend
backend/src/config/serviceAccountKey.json
backend/.env

# Frontend
frontend/build/
frontend/.env

# IDE
.vscode/
.idea/
*.swp
*.swo
```

### 1.2 Create Initial Commit

```bash
cd /c/Users/USER/Desktop/Projects/Mangadex

# Add all files
git add .

# Commit
git commit -m "Initial commit: MangaDex Reader application

- Complete React frontend with authentication
- Node.js/Express backend with MangaDex API integration
- Firebase authentication and Firestore bookmarks
- Mobile-responsive design
- Offline caching support
- Chapter reader with keyboard and touch navigation

🤖 Generated with Claude Code"
```

### 1.3 Create GitHub Repository

1. Go to https://github.com
2. Click the **+** icon in top right → **New repository**
3. Repository settings:
   - **Name**: `mangadex-reader` (or your preferred name)
   - **Description**: `A modern manga reader web application using MangaDex API with React and Firebase`
   - **Visibility**: Public or Private (your choice)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **Create repository**

### 1.4 Push to GitHub

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/mangadex-reader.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**✓ Task 1 Complete: Code is now on GitHub!**

---

## Step 2: Deploy Backend to Railway

We'll use Railway for the backend because it's free, easy, and works great with Node.js.

### 2.1 Sign Up / Log In to Railway

1. Go to https://railway.app
2. Click **Login** → Sign in with GitHub
3. Authorize Railway to access your GitHub account

### 2.2 Create New Project

1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Select your `mangadex-reader` repository
4. Railway will detect it's a monorepo with multiple services

### 2.3 Configure Backend Service

1. Railway might auto-detect the backend - if not, click **Add Service** → **GitHub Repo** → Select `mangadex-reader`
2. Configure the service:
   - **Name**: `mangadex-backend`
   - **Root Directory**: `/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 2.4 Add Environment Variables

In your Railway backend service, go to **Variables** tab and add:

```env
NODE_ENV=production
PORT=5000
MANGADEX_API_BASE_URL=https://api.mangadex.org
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
CACHE_TTL_SECONDS=300
```

### 2.5 Add Firebase Service Account

**IMPORTANT:** We need to add the Firebase service account key securely.

**Option A: Using Railway Volumes (Recommended)**
1. In Railway, go to **Service Settings**
2. Under **Variables**, add a new variable:
   - Key: `FIREBASE_CREDENTIALS`
   - Value: Paste the **entire contents** of your `serviceAccountKey.json` file
3. We'll need to modify the backend code to read from this variable

**Option B: Base64 Encoding (Alternative)**
1. Convert your service account key to base64:
   ```bash
   # Windows PowerShell
   $content = Get-Content backend/src/config/serviceAccountKey.json -Raw
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
   ```
2. Add to Railway:
   - Key: `FIREBASE_SERVICE_ACCOUNT_BASE64`
   - Value: (paste the base64 string)

For now, let's use **Option A** - I'll help you modify the code in a moment.

### 2.6 Deploy Backend

1. Railway will automatically deploy after you add variables
2. Wait for deployment to complete (usually 2-3 minutes)
3. Once deployed, you'll get a URL like: `https://mangadex-backend.up.railway.app`
4. **Copy this URL** - you'll need it for the frontend!

**✓ Task 2 Complete: Backend is deployed!**

---

## Step 3: Deploy Frontend to Netlify

### 3.1 Sign Up / Log In to Netlify

1. Go to https://netlify.com
2. Click **Sign up** → Sign up with GitHub
3. Authorize Netlify to access your GitHub account

### 3.2 Create New Site

1. Click **Add new site** → **Import an existing project**
2. Choose **Deploy with GitHub**
3. Select your `mangadex-reader` repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`

### 3.3 Add Environment Variables

In Netlify, go to **Site settings** → **Build & deploy** → **Environment** → **Environment variables**

Add the following variables:

```env
# Firebase Configuration (from your frontend/.env)
REACT_APP_FIREBASE_API_KEY=AIzaSyDZt6OCTPowvlcnICkwRcdn62kxPKEFyQ4
REACT_APP_FIREBASE_AUTH_DOMAIN=manga-reader-5aa33.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=manga-reader-5aa33
REACT_APP_FIREBASE_STORAGE_BUCKET=manga-reader-5aa33.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=547415195441
REACT_APP_FIREBASE_APP_ID=1:547415195441:web:59f83e54f08b95c8e73a10

# Backend API URL (use your Railway backend URL from Step 2.6)
REACT_APP_API_URL=https://mangadex-backend.up.railway.app
```

**IMPORTANT:** Replace `https://mangadex-backend.up.railway.app` with your actual Railway backend URL!

### 3.4 Deploy Frontend

1. Click **Deploy site**
2. Wait for build to complete (usually 2-3 minutes)
3. Your site will be live at: `https://random-name-12345.netlify.app`

### 3.5 Set Custom Domain (Optional)

1. In Netlify, go to **Site settings** → **Domain management**
2. Click **Options** → **Edit site name**
3. Choose a custom subdomain like: `my-manga-reader.netlify.app`

**✓ Task 3 Complete: Frontend is deployed!**

---

## Step 4: Configure Production Environment

### 4.1 Update Backend to Read Firebase Credentials from Environment

We need to modify the backend to read the Firebase service account from the Railway environment variable.

Create a new file `backend/src/config/firebase-production.js`:

```javascript
const admin = require('firebase-admin');

try {
  // In production, read credentials from environment variable
  if (process.env.NODE_ENV === 'production') {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin initialized successfully (production)');
  } else {
    // In development, read from file
    const path = require('path');
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin initialized successfully (development)');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);

  if (process.env.NODE_ENV === 'production') {
    console.log('Please ensure FIREBASE_CREDENTIALS environment variable is set in Railway');
  } else {
    console.log('Please ensure serviceAccountKey.json is placed in backend/src/config/');
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
```

**Update `backend/src/config/firebase.js`** to use this new logic, or replace it with the code above.

### 4.2 Update Frontend API URL

The frontend needs to know where the backend API is deployed.

**Update `frontend/src/services/api.js`:**

```javascript
import axios from 'axios';

// Use production API URL if available, otherwise use local
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// ... rest of the file
```

### 4.3 Update CORS Configuration

**Update `backend/src/server.js`** to allow requests from your Netlify domain:

```javascript
const cors = require('cors');

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-site-name.netlify.app'] // Replace with your actual Netlify URL
    : 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));
```

### 4.4 Commit and Push Changes

```bash
git add .
git commit -m "Configure for production deployment

- Add environment-based Firebase initialization
- Configure CORS for production
- Update API URL configuration

🤖 Generated with Claude Code"

git push origin main
```

Both Railway and Netlify will automatically redeploy with these changes!

**✓ Task 4 Complete: Production configuration updated!**

---

## Step 5: Test Your Deployment

### 5.1 Test Backend

Visit your Railway backend URL directly:
```
https://mangadex-backend.up.railway.app/health
```

You should see: `{"status":"OK","timestamp":"..."}`

### 5.2 Test Frontend

1. Visit your Netlify site: `https://your-site-name.netlify.app`
2. Try signing up with a new account
3. Try logging in
4. Try searching for manga
5. Try viewing manga details
6. Try reading a chapter
7. Try bookmarking a manga

### 5.3 Check Firebase

1. Go to Firebase Console → Authentication
2. You should see your test user
3. Go to Firestore → bookmarks collection
4. You should see bookmark documents

**✓ Task 5 Complete: Everything is working!**

---

## Troubleshooting

### Issue: "Failed to fetch" errors

**Cause:** CORS not configured correctly or backend URL wrong

**Fix:**
1. Check `frontend/.env` has correct `REACT_APP_API_URL`
2. Check `backend/src/server.js` has correct CORS origin
3. Rebuild both services

### Issue: Firebase authentication fails

**Cause:** Firebase domain not authorized

**Fix:**
1. Go to Firebase Console → Authentication → Settings
2. Under **Authorized domains**, add your Netlify domain
3. Click **Add domain** and enter: `your-site-name.netlify.app`

### Issue: Backend crashes on Railway

**Cause:** Missing environment variables

**Fix:**
1. Check Railway service → Variables
2. Ensure `FIREBASE_CREDENTIALS` is set
3. Check Railway logs for specific error

### Issue: Build fails on Netlify

**Cause:** Missing dependencies or environment variables

**Fix:**
1. Check Netlify deploy logs
2. Ensure all `REACT_APP_*` variables are set
3. Try clearing cache and redeploying

---

## Cost Summary

- **GitHub**: Free (for public repos)
- **Railway**: Free tier (500 hours/month, $5 credit)
- **Netlify**: Free tier (100GB bandwidth, 300 build minutes)
- **Firebase**: Free tier (Spark plan)

**Total Monthly Cost: $0** (within free tiers)

---

## Next Steps After Deployment

1. **Custom Domain**:
   - Buy a domain (e.g., from Namecheap, Google Domains)
   - Configure in Netlify: Site settings → Domain management

2. **Analytics**:
   - Add Google Analytics to track usage
   - Use Netlify Analytics for visitor stats

3. **Monitoring**:
   - Set up error tracking (Sentry)
   - Monitor Railway backend logs
   - Check Firebase quotas

4. **Security**:
   - Review Firebase security rules
   - Enable rate limiting on backend
   - Set up CSP headers

5. **Performance**:
   - Enable Netlify CDN
   - Optimize images
   - Add caching headers

---

**Congratulations! Your MangaDex Reader is now live! 🎉**

Share your deployed app: `https://your-site-name.netlify.app`

---

**Last Updated:** October 17, 2025
**Project:** MangaDex Reader Application
**Version:** 1.0.0
