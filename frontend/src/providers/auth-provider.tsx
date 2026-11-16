// frontend/src/providers/auth-provider.tsx

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  login as loginRequest,
  logoutRequest,
  refreshAuthSession,
  register as registerRequest,
  type AuthUser,
} from "@/lib/auth-api";

type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    null,
  );
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Restore an existing session when the application starts.
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const session = await refreshAuthSession();

        if (!isMounted) {
          return;
        }

        setUser(session.user);
        setAccessToken(session.accessToken);
        setStatus("authenticated");
      } catch {
        if (!isMounted) {
          return;
        }

        // No valid refresh session exists, so the visitor is signed out.
        setUser(null);
        setAccessToken(null);
        setStatus("unauthenticated");
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await loginRequest(email, password);

      setUser(session.user);
      setAccessToken(session.accessToken);
      setStatus("authenticated");
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const session = await registerRequest(email, password);

      setUser(session.user);
      setAccessToken(session.accessToken);
      setStatus("authenticated");
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      // Clear local authentication even if the server request fails.
      setUser(null);
      setAccessToken(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      status,
      login,
      register,
      logout,
    }),
    [user, accessToken, status, login, register, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Components use this hook to access authentication state and actions.
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider.",
    );
  }

  return context;
}
