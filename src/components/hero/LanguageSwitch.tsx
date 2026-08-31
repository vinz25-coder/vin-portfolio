import { ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

import type { Language } from "../../context/LanguageContext";
import { useLanguage } from "../../hooks/useLanguage";

const languageOptions: readonly {
  language: Language;
  name: string;
  shortLabel: string;
}[] = [
  { language: "id", name: "Bahasa Indonesia", shortLabel: "ID" },
  { language: "en", name: "English", shortLabel: "EN" },
];

interface LanguageSwitchProps {
  compact?: boolean;
  isScrolled?: boolean;
}

export function LanguageSwitch({
  compact = false,
  isScrolled = false,
}: LanguageSwitchProps) {
  const { language, setLanguage, copy } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusIndexOnOpen = useRef(0);
  const selectedIndex = languageOptions.findIndex(
    (option) => option.language === language,
  );

  useEffect(() => {
    if (isOpen) {
      optionRefs.current[focusIndexOnOpen.current]?.focus();
    }
  }, [isOpen]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  };

  const selectLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const openMenu = (focusIndex: number) => {
    focusIndexOnOpen.current = focusIndex;
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenu(selectedIndex);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(languageOptions.length - 1);
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      closeMenu();
    }
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const focusedIndex = optionRefs.current.findIndex(
      (option) => option === document.activeElement,
    );

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    const focusOption = (nextIndex: number) => {
      event.preventDefault();
      optionRefs.current[nextIndex]?.focus();
    };

    if (event.key === "ArrowDown") {
      focusOption((focusedIndex + 1) % languageOptions.length);
    } else if (event.key === "ArrowUp") {
      focusOption(
        (focusedIndex - 1 + languageOptions.length) % languageOptions.length,
      );
    } else if (event.key === "Home") {
      focusOption(0);
    } else if (event.key === "End") {
      focusOption(languageOptions.length - 1);
    }
  };

  return (
    <div className="relative" onBlur={handleBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={copy.a11y.languageMenuLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        data-compact={compact}
        data-scrolled={isScrolled}
        className={`global-nav-control flex h-[3.125rem] items-center justify-center rounded-full border border-border text-base text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
          compact ? "w-16 gap-1.5" : "w-[7.75rem] gap-2"
        }`}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openMenu(selectedIndex);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        {compact ? (
          <span className="font-medium text-accent-700 dark:text-accent-500">
            {languageOptions[selectedIndex]?.shortLabel}
          </span>
        ) : (
          languageOptions.map((option, index) => (
            <span key={option.language} className="contents">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              <span
                className={
                  language === option.language
                    ? "font-medium text-accent-700 dark:text-accent-500"
                    : undefined
                }
              >
                {option.shortLabel}
              </span>
            </span>
          ))
        )}
        <ChevronDown aria-hidden="true" size={18} strokeWidth={1.5} />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          tabIndex={-1}
          aria-label={copy.a11y.languageMenuLabel}
          className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-44 overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-[0_1rem_2.5rem_color-mix(in_srgb,var(--color-text-primary)_8%,transparent)]"
          onKeyDown={handleMenuKeyDown}
        >
          {languageOptions.map((option, index) => (
            <button
              key={option.language}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={language === option.language}
              aria-label={
                option.language === "id"
                  ? copy.a11y.selectIndonesian
                  : copy.a11y.selectEnglish
              }
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-accent-500"
              onClick={() => selectLanguage(option.language)}
            >
              {option.name}
              <span className="text-xs text-text-secondary">
                {option.shortLabel}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
