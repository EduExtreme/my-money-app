"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  // Justificativa técnica para useState/useEffect:
  // Precisamos ler do document.documentElement / localStorage somente no cliente (após a montagem)
  // para evitar erros de hidratação (SSR vs Client mismatch).
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasThemeCookie = document.cookie.split("; ").some((row) => row.startsWith("theme="));

    if (!hasThemeCookie) {
      const systemIsLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      const initialTheme = systemIsLight ? "light" : "dark";
      setTheme(initialTheme);
      if (initialTheme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
      document.cookie = `theme=${initialTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      const isLight = document.documentElement.classList.contains("light");
      setTheme(isLight ? "light" : "dark");
    }
  }, []);

  const toggleTheme = (event?: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    const updateTheme = () => {
      setTheme(nextTheme);

      if (nextTheme === "light") {
        document.documentElement.classList.add("light");
        localStorage.setItem("theme", "light");
        document.cookie = "theme=light; path=/; max-age=31536000; SameSite=Lax";
      } else {
        document.documentElement.classList.remove("light");
        localStorage.setItem("theme", "dark");
        document.cookie = "theme=dark; path=/; max-age=31536000; SameSite=Lax";
      }
    };

    // Justificativa técnica para startViewTransition:
    // O View Transitions API permite realizar uma animação de transição nativa e extremamente
    // fluida (efeito de revelação circular a partir do clique) na mudança de classes de tema.
    // @ts-ignore
    const isTransitionable = typeof document !== "undefined" && document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isTransitionable || !event) {
      updateTheme();
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      updateTheme();
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        {
          clipPath: nextTheme === "light" ? clipPath : [...clipPath].reverse(),
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: nextTheme === "light" ? "::view-transition-new(root)" : "::view-transition-old(root)",
        }
      );
    });
  };

  if (!mounted) {
    return (
      <div className="size-8 rounded-full border border-white/10 bg-white/[0.02]" />
    );
  }

  return (
    <button
      onClick={(e) => toggleTheme(e)}
      className="relative flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary shadow-sm transition-all duration-300 hover:scale-105 hover:bg-primary/10 dark:hover:text-white dark:border-white/10 dark:bg-white/[0.04]"
      aria-label="Alternar tema"
    >
      {theme === "dark" ? (
        <Sun className="size-4 animate-in spin-in-45 duration-300" />
      ) : (
        <Moon className="size-4 animate-in spin-in-45 duration-300" />
      )}
    </button>
  );
}
