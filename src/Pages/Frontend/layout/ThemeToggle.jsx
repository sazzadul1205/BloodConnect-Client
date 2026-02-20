// Pages/Frontend/layout/ThemeToggle.jsx

// React
import { useEffect, useState } from "react";

// Icons
import { FaMoon, FaSun } from "react-icons/fa";

// Constants
const COOKIE_NAME = "theme_preference";
const COOKIE_EXPIRE_DAYS = 365;

// Helper functions
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
};

const setCookie = (name, value, days) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const ThemeToggle = () => {
  // Lazy initialization from cookie or system
  const [theme, setTheme] = useState(() => {
    const savedTheme = getCookie(COOKIE_NAME);
    if (savedTheme) return savedTheme;

    // Detect system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Apply theme and save cookie whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    setCookie(COOKIE_NAME, theme, COOKIE_EXPIRE_DAYS);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-circle"
      title="Toggle Theme"
    >
      {theme === "light" ? <FaMoon className="text-lg" /> : <FaSun className="text-lg" />}
    </button>
  );
};

export default ThemeToggle;
