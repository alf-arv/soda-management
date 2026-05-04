import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  getStoredToken,
  login as apiLogin,
  normalizeLoginResponse,
  setStoredToken,
} from "../api/api";

const USER_KEY = "soda_auth_user";

function readUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.username) {
      return {
        username: String(parsed.username),
        role: parsed.role != null ? String(parsed.role) : null,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeUser(user) {
  if (user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        username: String(user.username),
        role: user.role != null ? String(user.role) : null,
      }),
    );
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => readUser());

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password);
    const { token: nextToken, user: nextUser } = normalizeLoginResponse(data);
    if (!nextToken) {
      throw new Error("No token received from server");
    }
    const resolvedUser =
      nextUser && nextUser.username
        ? nextUser
        : { username: String(username), role: null };

    setStoredToken(nextToken);
    writeUser(resolvedUser);
    setToken(nextToken);
    setUser(resolvedUser);
    return resolvedUser;
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    writeUser(null);
    setToken(null);
    setUser(null);
  }, []);

  const updateToken = useCallback((newToken) => {
    setStoredToken(newToken);
    setToken(newToken);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user?.username),
      login,
      logout,
      updateToken,
    }),
    [token, user, login, logout, updateToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
