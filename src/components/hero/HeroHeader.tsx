import { Github, Instagram, Linkedin, Mail, Menu, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

import { useLanguage } from "../../hooks/useLanguage";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useTheme } from "../../hooks/useTheme";
import { socialLinks } from "../../data/social-links";
import { mobileViewportQuery } from "../../lib/media-queries";
import { OPEN_MOBILE_GUESTBOOK_EVENT } from "../global/FloatingChatWidget";
import {
  navInteractionMotion,
  socialSidebarMotion,
} from "../../motion/constants";
import { LanguageSwitch } from "./LanguageSwitch";
import { ThemeToggle } from "./ThemeToggle";
import { TranslatedText } from "./TranslatedText";

const navItems = ["about", "projects"] as const;
const observedSections = ["about", "skills", "experience", "projects"] as const;
type NavSection = (typeof observedSections)[number];
const mobileNavItems = [
  "about",
  "skills",
  "experience",
  "projects",
  "contact",
] as const;
const mobileSocialIcons = {
  github: Github,
  linkedin: Linkedin,
  instagram: Instagram,
  email: Mail,
};

const mobileLandscapeHeaderQuery =
  "(orientation: landscape) and (max-width: 1023px) and (max-height: 640px)";
const tabletHeaderQuery = "(min-width: 640px) and (max-width: 1023px)";

interface HeroHeaderProps {
  isScrolled: boolean;
}

export function HeroHeader({ isScrolled }: HeroHeaderProps) {
  const { theme } = useTheme();
  const { copy } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window.matchMedia === "function"
      ? window.matchMedia(mobileViewportQuery).matches
      : false,
  );
  const [isTabletHeader, setIsTabletHeader] = useState(() =>
    typeof window.matchMedia === "function"
      ? window.matchMedia(tabletHeaderQuery).matches
      : false,
  );
  const [isLandscapeHeaderVisible, setIsLandscapeHeaderVisible] =
    useState(true);
  const [activeSection, setActiveSection] = useState<NavSection | null>(null);
  const lastScrollYRef = useRef(0);
  const mobileMenuId = useId();

  const openMobileGuestbook = () => {
    setIsMenuOpen(false);
    window.dispatchEvent(new Event(OPEN_MOBILE_GUESTBOOK_EVENT));
  };

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      return undefined;
    }

    const sections = observedSections.flatMap((item) => {
      const section = document.getElementById(item);
      return section ? [{ item, section }] : [];
    });

    if (sections.length === 0) {
      return undefined;
    }

    const visibleSections = new Set<NavSection>();
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const item = sections.find(
            ({ section }) => section === entry.target,
          )?.item;

          if (!item) {
            return;
          }

          if (entry.isIntersecting) {
            visibleSections.add(item);
          } else {
            visibleSections.delete(item);
          }
        });

        setActiveSection(
          observedSections.find((item) => visibleSections.has(item)) ?? null,
        );
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
    );

    sections.forEach(({ section }) => sectionObserver.observe(section));

    return () => sectionObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mobileQuery = window.matchMedia(mobileViewportQuery);
    const tabletQuery = window.matchMedia(tabletHeaderQuery);
    const updateViewport = () => {
      setIsMobileViewport(mobileQuery.matches);
      setIsTabletHeader(tabletQuery.matches && !mobileQuery.matches);
      setIsMenuOpen(false);
    };

    updateViewport();
    mobileQuery.addEventListener("change", updateViewport);
    tabletQuery.addEventListener("change", updateViewport);

    return () => {
      mobileQuery.removeEventListener("change", updateViewport);
      tabletQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return undefined;
    }

    const landscapeViewportQuery = window.matchMedia(
      mobileLandscapeHeaderQuery,
    );

    const resetHeaderVisibility = () => {
      lastScrollYRef.current = Math.max(window.scrollY, 0);
      setIsLandscapeHeaderVisible(true);
    };

    const updateHeaderVisibility = () => {
      const nextScrollY = Math.max(window.scrollY, 0);
      const scrollDelta = nextScrollY - lastScrollYRef.current;

      if (!landscapeViewportQuery.matches) {
        setIsLandscapeHeaderVisible(true);
        lastScrollYRef.current = nextScrollY;
        return;
      }

      if (nextScrollY === 0) {
        setIsLandscapeHeaderVisible(true);
        lastScrollYRef.current = nextScrollY;
      } else if (scrollDelta >= socialSidebarMotion.tooltipOffset) {
        setIsLandscapeHeaderVisible(false);
        setIsMenuOpen(false);
        lastScrollYRef.current = nextScrollY;
      } else if (scrollDelta <= -socialSidebarMotion.tooltipOffset) {
        setIsLandscapeHeaderVisible(true);
        lastScrollYRef.current = nextScrollY;
      }
    };

    resetHeaderVisibility();
    landscapeViewportQuery.addEventListener("change", resetHeaderVisibility);
    window.addEventListener("scroll", updateHeaderVisibility, {
      passive: true,
    });

    return () => {
      landscapeViewportQuery.removeEventListener(
        "change",
        resetHeaderVisibility,
      );
      window.removeEventListener("scroll", updateHeaderVisibility);
    };
  }, []);

  return (
    <motion.header
      data-scrolled={isScrolled}
      data-landscape-nav-visible={isLandscapeHeaderVisible}
      initial={false}
      animate={{ y: isLandscapeHeaderVisible ? "0%" : "-100%" }}
      transition={{
        duration: prefersReducedMotion ? 0 : socialSidebarMotion.navbarDuration,
        ease: socialSidebarMotion.ease,
      }}
      aria-hidden={!isLandscapeHeaderVisible}
      inert={!isLandscapeHeaderVisible}
      className="hero-header pointer-events-none fixed inset-x-0 top-0 isolate z-50 flex h-24 items-center px-3 min-[320px]:px-5 sm:h-18 sm:px-12 lg:h-[7.75rem] lg:px-[3.35vw]"
    >
      <a
        href="#home"
        aria-label={copy.a11y.homeLink}
        data-testid="navbar-logo-frame"
        className="navbar-logo-frame pointer-events-auto relative z-10 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500 sm:left-2"
      >
        <img
          src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
          width={60}
          height={40}
          alt="Evindo Amanda"
          decoding="async"
          className="relative z-10 h-9 w-[3.375rem] object-contain sm:h-10 sm:w-[3.75rem]"
        />
      </a>

      <div
        id={mobileMenuId}
        data-mobile-landscape-layout={isMobileViewport}
        className={`hero-mobile-menu ${
          isMenuOpen
            ? "grid"
            : isMobileViewport
              ? "hidden"
              : "hidden sm:contents"
        } pointer-events-auto absolute inset-x-3 top-20 z-10 grid-cols-1 gap-5 rounded-[1.35rem] border border-border bg-surface p-4 shadow-[0_1rem_2.5rem_color-mix(in_srgb,var(--color-accent-500)_10%,transparent)] min-[320px]:inset-x-5 min-[320px]:gap-6 min-[320px]:p-6 sm:inset-x-12 sm:top-24 lg:contents`}
      >
        {!isMobileViewport ? (
          <nav
            aria-label={copy.a11y.primaryNavigation}
            data-scrolled={isScrolled}
            className="hero-nav-glass grid grid-cols-2 gap-1 rounded-full border border-border p-2 text-sm font-medium text-text-nav min-[1440px]:left-[51.25%] sm:absolute sm:left-1/2 sm:flex sm:-translate-x-1/2 sm:items-center sm:whitespace-nowrap lg:left-[44%] xl:left-[47%]"
          >
            {navItems.map((item) =>
              item === "about" ? (
                <motion.a
                  key={item}
                  href="#about"
                  data-testid={`hero-nav-${item}`}
                  data-active={
                    activeSection === "about" ||
                    activeSection === "skills" ||
                    activeSection === "experience"
                  }
                  aria-current={
                    activeSection === "about" ||
                    activeSection === "skills" ||
                    activeSection === "experience"
                      ? "page"
                      : undefined
                  }
                  whileTap={{ scale: navInteractionMotion.pressedScale }}
                  transition={{
                    duration: navInteractionMotion.pressedDuration,
                    ease: navInteractionMotion.ease,
                  }}
                  className={`hero-nav-item focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
                    activeSection === "about" ||
                    activeSection === "skills" ||
                    activeSection === "experience"
                      ? "active"
                      : ""
                  }`}
                >
                  <TranslatedText inline>{copy.nav[item]}</TranslatedText>
                </motion.a>
              ) : (
                <motion.span
                  key={item}
                  role="link"
                  aria-disabled="true"
                  tabIndex={-1}
                  data-testid={`hero-nav-${item}`}
                  whileTap={{ scale: navInteractionMotion.pressedScale }}
                  transition={{
                    duration: navInteractionMotion.pressedDuration,
                    ease: navInteractionMotion.ease,
                  }}
                  className="hero-nav-item cursor-not-allowed"
                >
                  <TranslatedText inline>{copy.nav[item]}</TranslatedText>
                </motion.span>
              ),
            )}
          </nav>
        ) : isMenuOpen ? (
          <div className="grid grid-cols-1 gap-1">
            {mobileNavItems.map((item) =>
              item === "about" || item === "skills" || item === "experience" ? (
                <a
                  key={item}
                  href={`#${item}`}
                  data-active={activeSection === item}
                  aria-current={activeSection === item ? "page" : undefined}
                  className={`hero-mobile-menu-item ${
                    activeSection === item ? "active" : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <TranslatedText inline>{copy.nav[item]}</TranslatedText>
                </a>
              ) : (
                <span
                  key={item}
                  role="link"
                  aria-disabled="true"
                  tabIndex={-1}
                  className="hero-mobile-menu-item cursor-not-allowed"
                >
                  <TranslatedText inline>{copy.nav[item]}</TranslatedText>
                </span>
              ),
            )}
            <button
              type="button"
              className="hero-mobile-menu-item text-left"
              onClick={openMobileGuestbook}
            >
              {copy.chat.guestbook}
            </button>
          </div>
        ) : null}

        {isMobileViewport && isMenuOpen ? (
          <div className="border-t border-border pt-4">
            <div
              className="flex items-center gap-2"
              aria-label={copy.a11y.socialSidebar}
            >
              {socialLinks.map((link) => {
                const Icon = mobileSocialIcons[link.platform];

                return link.href ? (
                  <a
                    key={link.platform}
                    href={link.href}
                    aria-label={link.label}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      link.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="hero-mobile-social-link"
                  >
                    <Icon aria-hidden="true" size={21} strokeWidth={1.7} />
                  </a>
                ) : (
                  <span
                    key={link.platform}
                    role="link"
                    aria-disabled="true"
                    aria-label={link.label}
                    className="hero-mobile-social-link cursor-not-allowed opacity-40"
                  >
                    <Icon aria-hidden="true" size={21} strokeWidth={1.7} />
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        {!isMobileViewport && !isTabletHeader ? (
          <div className="hidden flex-wrap items-center gap-2 border-t border-border pt-4 min-[320px]:gap-3 min-[320px]:pt-5 lg:ml-auto lg:flex lg:flex-nowrap lg:border-0 lg:p-0">
            <LanguageSwitch isScrolled={isScrolled} />
          </div>
        ) : null}
      </div>

      <div className="pointer-events-auto relative z-10 ml-auto flex items-center gap-2 lg:ml-4 lg:gap-4">
        {isMobileViewport || isTabletHeader ? (
          <div className="mobile-language-switch lg:hidden">
            <LanguageSwitch compact isScrolled={isScrolled} />
          </div>
        ) : null}
        <ThemeToggle isScrolled={isScrolled} />
        {isMobileViewport ? (
          <button
            type="button"
            aria-label={
              isMenuOpen
                ? copy.a11y.closeNavigationMenu
                : copy.a11y.openNavigationMenu
            }
            aria-expanded={isMenuOpen}
            aria-controls={mobileMenuId}
            data-testid="mobile-navigation-toggle"
            data-scrolled={isScrolled}
            className="global-nav-control flex size-12 items-center justify-center rounded-full border border-border text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 lg:hidden"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          >
            {isMenuOpen ? (
              <X aria-hidden="true" size={22} strokeWidth={1.5} />
            ) : (
              <Menu aria-hidden="true" size={23} strokeWidth={1.5} />
            )}
          </button>
        ) : null}
      </div>
    </motion.header>
  );
}
