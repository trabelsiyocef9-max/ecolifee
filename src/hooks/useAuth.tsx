import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type StoredUser = { name: string; email: string; password: string };
type SessionUser = { name: string; email: string };

type AuthContextValue = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  signUp: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
};

const USERS_KEY = "ecolife.users";
const SESSION_KEY = "ecolife.session";

const AuthContext = createContext<AuthContextValue | null>(null);

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as SessionUser);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  function persistSession(next: SessionUser | null) {
    setUser(next);
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    signUp(name, email, password) {
      const users = readUsers();
      const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) return { ok: false, error: "An account with that email already exists." };
      const next = [...users, { name, email, password }];
      writeUsers(next);
      persistSession({ name, email });
      return { ok: true };
    },
    signIn(email, password) {
      const users = readUsers();
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      );
      if (!found) return { ok: false, error: "Invalid email or password." };
      persistSession({ name: found.name, email: found.email });
      return { ok: true };
    },
    signOut() {
      persistSession(null);
    },
  };

  if (!ready) return null;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
