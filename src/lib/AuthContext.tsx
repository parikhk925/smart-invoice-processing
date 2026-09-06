"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "./types";
import { getUsers, saveUsers, getSession, setSession, seedDemoData } from "./store";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = getSession();
    if (id) {
      const found = getUsers().find((u) => u.id === id) ?? null;
      setUser(found);
      if (found) seedDemoData(found.id);
    }
    setLoading(false);
  }, []);

  function login(email: string, password: string) {
    const users = getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) {
      return { ok: false, error: "Invalid email or password." };
    }
    setSession(found.id);
    setUser(found);
    seedDemoData(found.id);
    return { ok: true };
  }

  function register(name: string, email: string, password: string) {
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: "An account with this email already exists." };
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      role: "Admin",
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
    setSession(newUser.id);
    setUser(newUser);
    seedDemoData(newUser.id);
    return { ok: true };
  }

  function logout() {
    setSession(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
