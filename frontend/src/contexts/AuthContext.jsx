import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  async function signup(email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    setAuthToken(token);
    return userCredential;
  }

  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    setAuthToken(token);
    return userCredential;
  }

  async function logout() {
    setAuthToken(null);
    return signOut(auth);
  }

  async function refreshToken() {
    if (currentUser) {
      const token = await currentUser.getIdToken(true);
      setAuthToken(token);
      return token;
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const token = await user.getIdToken();
        setAuthToken(token);
      } else {
        setAuthToken(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Refresh token every 50 minutes (tokens expire after 1 hour)
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(async () => {
        await refreshToken();
      }, 50 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const value = {
    currentUser,
    authToken,
    signup,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
