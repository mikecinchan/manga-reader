import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setAuthTokenGetter } from './services/api';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import MangaDetailsPage from './pages/MangaDetailsPage';
import ReaderPage from './pages/ReaderPage';
import BookmarksPage from './pages/BookmarksPage';
import './styles/App.css';

function AppContent() {
  const { authToken } = useAuth();

  useEffect(() => {
    // Set up the auth token getter for API calls
    setAuthTokenGetter(() => authToken);
  }, [authToken]);

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />

          <Route
            path="/manga/:id"
            element={
              <PrivateRoute>
                <MangaDetailsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/reader/:chapterId"
            element={
              <PrivateRoute>
                <ReaderPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/bookmarks"
            element={
              <PrivateRoute>
                <BookmarksPage />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
