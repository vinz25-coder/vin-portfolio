import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { en } from "../locales/en";
import { id } from "../locales/id";
import type { HeroCopy } from "../locales/types";

export type Language = "en" | "id";

export interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  copy: HeroCopy;
}

export const LANGUAGE_STORAGE_KEY = "portfolio-language";

export const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

interface LanguageProviderProps {
  children: ReactNode;
}

const translations: Record<Language, HeroCopy> = { en, id };

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "id";
}

function readStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(storedLanguage) ? storedLanguage : "en";
  } catch {
    return "en";
  }
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // The active language still updates when storage is unavailable.
    }
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      copy: translations[language],
    }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
