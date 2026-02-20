// hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";
import useAxiosPublic from "./useAxiosPublic";

// Keys for localStorage to persist user and token
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const useAuth = () => {
  const { axiosInstance } = useAxiosPublic(); // Axios instance for API calls

  // State for user and token, initialized from localStorage if available
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(false); // Loading state for async actions
  const [error, setError] = useState(null); // Error state for API calls

  /**
   * Save user and token to state and localStorage
   * @param {object} userData - User info from API
   * @param {string} tokenData - JWT token from API
   */
  const saveAuth = useCallback((userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(TOKEN_KEY, tokenData);
  }, []);

  /**
   * Clear auth data from state and localStorage
   */
  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  /**
   * Login function
   * Accepts email/phone and password, calls /auth/login API
   * Saves user and token on success
   */
  const login = useCallback(
    async ({ email, phone, password }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.post("/auth/login", {
          email,
          phone,
          password,
        });
        saveAuth(res.data.data.user, res.data.data.token);
        return res.data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, saveAuth],
  );

  /**
   * Register function
   * Accepts user info, calls /auth/register API
   * Saves user and token on success
   */
  const register = useCallback(
    async ({ email, phone, password, role, fullName, bloodGroup }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.post("/auth/register", {
          email,
          phone,
          password,
          role,
          fullName,
          bloodGroup,
        });
        saveAuth(res.data.data.user, res.data.data.token);
        return res.data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, saveAuth],
  );

  /**
   * Logout function
   * Calls /auth/logout API (optional) and clears auth data
   */
  const logout = useCallback(async () => {
    try {
      await axiosInstance.post("/auth/logout"); // optional
    } catch (err) {
      console.warn("Logout API failed", err);
    }
    clearAuth(); // always clear auth data locally
  }, [axiosInstance, clearAuth]);

  /**
   * Refresh JWT token
   * Calls /auth/refresh-token API with current token
   * Updates state and localStorage
   */
  const refreshToken = useCallback(async () => {
    if (!token) return null;
    try {
      const res = await axiosInstance.post("/auth/refresh-token", { token });
      setToken(res.data.data.token);
      localStorage.setItem(TOKEN_KEY, res.data.data.token);
      return res.data.data.token;
    } catch (err) {
      clearAuth(); // If refresh fails, log out user
      throw err;
    }
  }, [axiosInstance, token, clearAuth]);

  /**
   * Optional: auto-refresh token on mount if token exists
   */
  useEffect(() => {
    if (token) {
      refreshToken().catch(() => {
        console.warn("Token refresh failed, logging out");
      });
    }
  }, [token, refreshToken]);

  return {
    user, // Current user object
    token, // Current JWT token
    loading, // Loading state for login/register actions
    error, // Error object if API fails
    login, // Login function
    register, // Register function
    logout, // Logout function
    refreshToken, // Refresh token function
  };
};

export default useAuth;
