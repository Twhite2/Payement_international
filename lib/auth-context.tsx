"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, AuthState } from "@/types";

interface AuthContextValue extends AuthState {
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "payintl_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthState;
        if (parsed.token && parsed.user) {
          // Re-validate session with the server (store resets on restart)
          fetch("/api/auth/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: parsed.user }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.valid && data.user) {
                const refreshed: AuthState = {
                  user: data.user,
                  token: parsed.token,
                  isAuthenticated: true,
                };
                setState(refreshed);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
              } else {
                localStorage.removeItem(STORAGE_KEY);
              }
            })
            .catch(() => {
              // Fallback: use cached state even if validate fails
              setState(parsed);
            });
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback((user: User, token: string) => {
    const newState: AuthState = { user, token, isAuthenticated: true };
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, token: null, isAuthenticated: false });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
