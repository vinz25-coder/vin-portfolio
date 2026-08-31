import { Moon, Sun } from "lucide-react";

import { useLanguage } from "../../hooks/useLanguage";
import { useTheme } from "../../hooks/useTheme";

interface ThemeToggleProps {
  isScrolled?: boolean;
}

export function ThemeToggle({ isScrolled = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { copy } = useLanguage();
  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      aria-label={
        nextTheme === "dark"
          ? copy.a11y.switchThemeToDark
          : copy.a11y.switchThemeToLight
      }
      aria-pressed={theme === "dark"}
      data-scrolled={isScrolled}
      className="global-nav-control flex size-12 items-center justify-center rounded-full border border-border text-text-secondary transition-colors duration-300 ease-[ease] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 lg:h-[3.125rem] lg:w-32 lg:justify-stretch"
      onClick={() => setTheme(nextTheme)}
    >
      <span
        className={`h-full flex-1 items-center justify-center ${
          theme === "light"
            ? "flex text-accent-500"
            : "hidden text-text-secondary lg:flex"
        }`}
      >
        <Sun aria-hidden="true" size={23} strokeWidth={1.5} />
      </span>
      <span
        className={`h-full flex-1 items-center justify-center ${
          theme === "dark"
            ? "flex text-accent-500"
            : "hidden text-text-secondary lg:flex"
        }`}
      >
        <Moon aria-hidden="true" size={21} strokeWidth={1.5} />
      </span>
    </button>
  );
}
