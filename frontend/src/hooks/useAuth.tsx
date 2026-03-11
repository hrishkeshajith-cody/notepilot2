import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  session: any;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_CACHE_KEY = "notepilot_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Load cached user instantly so UI doesn't flash to login
  const cachedUser = (() => {
    try {
      const raw = localStorage.getItem(USER_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [user, setUser] = useState<User | null>(cachedUser);
  const [session, setSession] = useState<any>(cachedUser ? { user: cachedUser } : null);
  const [isLoading, setIsLoading] = useState(!cachedUser); // skip loading if cache hit

  useEffect(() => {
    checkSession();
  }, []);

  const setUserData = (userData: User | null) => {
    setUser(userData);
    setSession(userData ? { user: userData } : null);
    if (userData) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
    }
  };

  const checkSession = async () => {
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) {
        const userData = await response.json();
        setUserData(userData);
      } else {
        // Session invalid — clear cache
        setUserData(null);
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        // Render is waking up — keep cached user, don't log out
        console.warn("Session check timed out (Render cold start) — keeping cached session");
      } else {
        console.error("Session check error:", error);
        setUserData(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
      const response = await fetch(`${backendUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name: fullName || email.split("@")[0] }),
      });
      if (!response.ok) {
        const error = await response.json();
        return { error: { message: error.detail || "Signup failed" } };
      }
      const userData = await response.json();
      setUserData(userData);
      return { error: null };
    } catch (error) {
      return { error: { message: "Network error. Please try again." } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        return { error: { message: error.detail || "Login failed" } };
      }
      const userData = await response.json();
      setUserData(userData);
      return { error: null };
    } catch (error) {
      return { error: { message: "Network error. Please try again." } };
    }
  };

  const signOut = async () => {
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Signout error:", error);
    } finally {
      setUserData(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
