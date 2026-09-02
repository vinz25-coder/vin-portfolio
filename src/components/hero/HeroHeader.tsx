import { Github, Instagram, Mail, Menu, X } from "lucide-react";
import { motion } from "motion/react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";

import { useLanguage } from "../../hooks/useLanguage";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useTheme } from "../../hooks/useTheme";
import { socialLinks } from "../../data/social-links";
import { mobileViewportQuery } from "../../lib/media-queries";
import { OPEN_MOBILE_GUESTBOOK_EVENT } from "../global/FloatingChatWidget";
import { BrandXIcon } from "../global/BrandXIcon";
import {
  navInteractionMotion,
  socialSidebarMotion,
} from "../../motion/constants";
import { LanguageSwitch } from "./LanguageSwitch";
import { ThemeToggle } from "./ThemeToggle";
import { TranslatedText } from "./TranslatedText";

const navItems = ["about", "projects"] as const;
const observedSections = [
  "about",
  "skills",
  "experience",
  "work-with-me",
  "projects",
] as const;
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
  x: BrandXIcon,
  instagram: Instagram,
  email: Mail,
};

const tabletHeaderQuery = "(min-width: 640px) and (max-width: 1023px)";
const MotionLink = motion.create(Link);

interface HeroHeaderProps {
  isScrolled: boolean;
  page?: "home" | "contact";
}

export function HeroHeader({ isScrolled, page = "home" }: HeroHeaderProps) {
  const navigate = useNavigate();
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
  const [isMobileHeaderVisible, setIsMobileHeaderVisible] = useState(true);
  const [activeSection, setActiveSection] = useState<NavSection | null>(null);
  const lastScrollYRef = useRef(0);
  const mobileMenuId = useId();
  const isAboutActive =
    activeSection === "about" ||
    activeSection === "skills" ||
    activeSection === "experience" ||
    activeSection === "work-with-me";

  const openMobileGuestbook = () => {
    setIsMenuOpen(false);
    window.dispatchEvent(new Event(OPEN_MOBILE_GUESTBOOK_EVENT));
  };

  const navigateToSection = (
    event: MouseEvent<HTMLAnchorElement>,
    section: "about" | "skills" | "experience",
    closeMenu = false,
  ) => {
    if (closeMenu) setIsMenuOpen(false);
    if (page !== "home") return;

    event.preventDefault();
    void navigate(`/#${section}`);
    document.getElementById(section)?.scrollIntoView({ block: "start" });
  };

  useEffect(() => {
    if (page !== "home") {
      setActiveSection(null);
      return undefined;
    }

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
  }, [page]);

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

    const mobileHeaderQuery = window.matchMedia(mobileViewportQuery);

    const resetHeaderVisibility = () => {
      lastScrollYRef.current = Math.max(window.scrollY, 0);
      setIsMobileHeaderVisible(true);
    };

    const updateHeaderVisibility = () => {
      const nextScrollY = Math.max(window.scrollY, 0);
      const scrollDelta = nextScrollY - lastScrollYRef.current;

      if (!mobileHeaderQuery.matches) {
        setIsMobileHeaderVisible(true);
        lastScrollYRef.current = nextScrollY;
        return;
      }

      if (nextScrollY === 0) {
        setIsMobileHeaderVisible(true);
        lastScrollYRef.current = nextScrollY;
      } else if (scrollDelta >= socialSidebarMotion.tooltipOffset) {
        setIsMobileHeaderVisible(false);
        setIsMenuOpen(false);
        lastScrollYRef.current = nextScrollY;
      } else if (scrollDelta <= -socialSidebarMotion.tooltipOffset) {
        setIsMobileHeaderVisible(true);
        lastScrollYRef.current = nextScrollY;
      }
    };

    resetHeaderVisibility();
    mobileHeaderQuery.addEventListener("change", resetHeaderVisibility);
    window.addEventListener("scroll", updateHeaderVisibility, {
      passive: true,
    });

    return () => {
      mobileHeaderQuery.removeEventListener("change", resetHeaderVisibility);
      window.removeEventListener("scroll", updateHeaderVisibility);
    };
  }, []);

  return (
    <motion.header
      data-scrolled={isScrolled}
      data-mobile-nav-visible={isMobileHeaderVisible}
      initial={false}
      animate={{ y: isMobileHeaderVisible ? "0%" : "-100%" }}
      transition={{
        duration: prefersReducedMotion ? 0 : socialSidebarMotion.navbarDuration,
        ease: socialSidebarMotion.ease,
      }}
      aria-hidden={!isMobileHeaderVisible}
      inert={!isMobileHeaderVisible}
      className="hero-header pointer-events-none fixed inset-x-0 top-0 isolate z-50 flex h-24 items-center px-3 min-[320px]:px-5 sm:h-18 sm:px-12 lg:h-[7.75rem] lg:px-[3.35vw]"
    >
      <Link
        to={page === "contact" ? "/" : "#home"}
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
      </Link>

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
            className="hero-nav-glass grid grid-cols-2 gap-1 rounded-full border border-border p-2 text-sm font-medium text-text-nav sm:absolute sm:left-1/2 sm:flex sm:-translate-x-1/2 sm:items-center sm:whitespace-nowrap"
          >
            {navItems.map((item) =>
              item === "about" ? (
                <MotionLink
                  key={item}
                  to={page === "contact" ? "/#about" : "#about"}
                  data-testid={`hero-nav-${item}`}
                  data-active={isAboutActive}
                  aria-current={isAboutActive ? "page" : undefined}
                  whileTap={{ scale: navInteractionMotion.pressedScale }}
                  transition={{
                    duration: navInteractionMotion.pressedDuration,
                    ease: navInteractionMotion.ease,
                  }}
                  className={`hero-nav-item focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${isAboutActive ? "active" : ""}`}
                  onClick={(event) => navigateToSection(event, "about")}
                >
                  <TranslatedText inline>{copy.nav[item]}</TranslatedText>
                </MotionLink>
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
                <Link
                  key={item}
                  to={`${page === "contact" ? "/" : ""}#${item}`}
                  data-active={
                    item === "about"
                      ? activeSection === "about" ||
                        activeSection === "work-with-me"
                      : activeSection === item
                  }
                  aria-current={
                    (
                      item === "about"
                        ? activeSection === "about" ||
                          activeSection === "work-with-me"
                        : activeSection === item
                    )
                      ? "page"
                      : undefined
                  }
                  className={`hero-mobile-menu-item ${
                    (
                      item === "about"
                        ? activeSection === "about" ||
                          activeSection === "work-with-me"
                        : activeSection === item
                    )
                      ? "active"
                      : ""
                  }`}
                  onClick={(event) => navigateToSection(event, item, true)}
                >
                  <TranslatedText inline>{copy.nav[item]}</TranslatedText>
                </Link>
              ) : item === "contact" ? (
                <Link
                  key={item}
                  to="/contact"
                  data-active={page === "contact"}
                  aria-current={page === "contact" ? "page" : undefined}
                  className={`hero-mobile-menu-item ${page === "contact" ? "active" : ""}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <TranslatedText inline>{copy.nav[item]}</TranslatedText>
                </Link>
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
