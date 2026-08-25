import React, { createContext, useContext, useState, useEffect } from "react";
import { auth as firebaseAuth, isFirebaseConfigured } from "../firebase";
import { signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext(null);

const STORAGE_KEY = "retailmind_auth_session";

// Default Administrator Credentials
export const ADMIN_CREDENTIALS = {
  username: "mohan",
  email: "mohan@retailmind.ai",
  password: "admin1234",
  name: "Mohan",
  role: "Administrator",
  title: "Store Owner & System Admin",
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Sync with Firebase Auth state if Firebase is configured
  useEffect(() => {
    if (isFirebaseConfigured && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        if (user) {
          const userData = {
            uid: user.uid,
            username: user.displayName || user.email?.split("@")[0] || "mohan",
            email: user.email || ADMIN_CREDENTIALS.email,
            name: user.displayName || ADMIN_CREDENTIALS.name,
            role: "Administrator",
            provider: "firebase",
            token: user.accessToken || "fb_session",
            lastLogin: new Date().toISOString(),
          };
          setCurrentUser(userData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        }
        setIsAuthLoading(false);
      });
      return unsubscribe;
    } else {
      // Check stored session
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to load local auth session:", e);
      }
      setIsAuthLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    setIsAuthLoading(true);
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanPwd = (password || "").trim();

    // 1. Check if Firebase is active & user entered an email
    if (isFirebaseConfigured && firebaseAuth && cleanId.includes("@")) {
      try {
        const res = await signInWithEmailAndPassword(firebaseAuth, cleanId, cleanPwd);
        const userData = {
          uid: res.user.uid,
          username: res.user.displayName || res.user.email?.split("@")[0] || "mohan",
          email: res.user.email,
          name: res.user.displayName || ADMIN_CREDENTIALS.name,
          role: "Administrator",
          provider: "firebase",
          lastLogin: new Date().toISOString(),
        };
        setCurrentUser(userData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        setIsAuthLoading(false);
        return { success: true, user: userData };
      } catch (fbErr) {
        console.warn("[Auth] Firebase sign-in failed, trying local admin credentials:", fbErr.message);
      }
    }

    // 2. Validate against Admin credentials (username 'mohan' or 'mohan@retailmind.ai')
    await new Promise((resolve) => setTimeout(resolve, 400)); // slight natural feel

    const isValidUser =
      cleanId === ADMIN_CREDENTIALS.username.toLowerCase() ||
      cleanId === ADMIN_CREDENTIALS.email.toLowerCase() ||
      cleanId === "admin";

    const isValidPass = cleanPwd === ADMIN_CREDENTIALS.password;

    if (isValidUser && isValidPass) {
      const userData = {
        uid: "admin_mohan_001",
        username: ADMIN_CREDENTIALS.username,
        email: ADMIN_CREDENTIALS.email,
        name: ADMIN_CREDENTIALS.name,
        role: ADMIN_CREDENTIALS.role,
        title: ADMIN_CREDENTIALS.title,
        provider: "local_admin",
        lastLogin: new Date().toISOString(),
      };
      setCurrentUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setIsAuthLoading(false);
      return { success: true, user: userData };
    }

    setIsAuthLoading(false);
    throw new Error("Invalid username or password. Please verify your credentials.");
  };

  const logout = async () => {
    if (isFirebaseConfigured && firebaseAuth) {
      try {
        await fbSignOut(firebaseAuth);
      } catch (e) {
        console.error("Firebase sign-out error:", e);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateAdminProfile = (updates) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAuthLoading,
        login,
        logout,
        updateAdminProfile,
        isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
