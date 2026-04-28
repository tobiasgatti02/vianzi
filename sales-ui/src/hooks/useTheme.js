import { useEffect, useState } from "react";

const STORAGE_KEY = "ui-theme"; // "light" | "dark"

function getSystemTheme() {
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = saved === "dark" || saved === "light" ? saved : getSystemTheme();
    setTheme(initial);
  }, []);

  useEffect(() => {
    const root = document.documentElement; // <html>
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  return { theme, toggleTheme, setTheme };
}