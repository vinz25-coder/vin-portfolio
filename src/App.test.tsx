import axe from "axe-core";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { AboutStatus } from "./components/about/AboutStatus";
import {
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from "./context/LanguageContext";
import { THEME_STORAGE_KEY, ThemeProvider } from "./context/ThemeContext";
import { portraitAssets } from "./data/portrait-assets";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import {
  entranceTimings,
  getEntranceMotion,
  getPortraitThemeTransition,
  rotatingStatusMotion,
} from "./motion/constants";

interface MediaPreferences {
  desktopViewport?: boolean;
  mobilePhoneLandscapeViewport?: boolean;
  mobileLandscapeViewport?: boolean;
  tabletHeaderViewport?: boolean;
  pointerFine?: boolean;
  prefersDark?: boolean;
  prefersReducedMotion?: boolean;
}

function mockMediaPreferences({
  desktopViewport = true,
  mobilePhoneLandscapeViewport = false,
  mobileLandscapeViewport = false,
  tabletHeaderViewport = false,
  pointerFine = false,
  prefersDark = false,
  prefersReducedMotion = false,
}: MediaPreferences = {}) {
  const matchMedia = vi.fn(
    (query: string): MediaQueryList =>
      ({
        matches:
          (query === "(prefers-color-scheme: dark)" && prefersDark) ||
          (query === "(prefers-reduced-motion: reduce)" &&
            prefersReducedMotion) ||
          (query === "(pointer: fine)" && pointerFine) ||
          (query ===
            "(orientation: landscape) and (max-width: 1023px) and (max-height: 640px)" &&
            mobileLandscapeViewport) ||
          (query ===
            "(max-width: 639.98px), (orientation: landscape) and (max-width: 1023px) and (max-height: 500px)" &&
            (!desktopViewport || mobilePhoneLandscapeViewport)) ||
          (query === "(min-width: 640px) and (max-width: 1023px)" &&
            tabletHeaderViewport) ||
          (query === "(min-width: 640px)" && desktopViewport) ||
          (query === "(max-width: 639px)" && !desktopViewport),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      }) satisfies MediaQueryList,
  );

  vi.stubGlobal("matchMedia", matchMedia);
}

function mockViewport(width: number, height: number) {
  const orientation = width > height ? "landscape" : "portrait";
  const evaluateClause = (clause: string) => {
    const minWidth = clause.match(/\(min-width: ([\d.]+)px\)/)?.[1];
    const maxWidth = clause.match(/\(max-width: ([\d.]+)px\)/)?.[1];
    const minHeight = clause.match(/\(min-height: (\d+)px\)/)?.[1];
    const maxHeight = clause.match(/\(max-height: (\d+)px\)/)?.[1];
    const requiredOrientation = clause.match(
      /\(orientation: (landscape|portrait)\)/,
    )?.[1];

    return (
      (!minWidth || width >= Number(minWidth)) &&
      (!maxWidth || width <= Number(maxWidth)) &&
      (!minHeight || height >= Number(minHeight)) &&
      (!maxHeight || height <= Number(maxHeight)) &&
      (!requiredOrientation || orientation === requiredOrientation) &&
      !clause.includes("prefers-color-scheme: dark") &&
      !clause.includes("prefers-reduced-motion: reduce") &&
      !clause.includes("pointer: fine")
    );
  };
  const matchMedia = vi.fn(
    (query: string): MediaQueryList =>
      ({
        matches: query.split(",").some((clause) => evaluateClause(clause)),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      }) satisfies MediaQueryList,
  );

  vi.stubGlobal("matchMedia", matchMedia);
}

function mockIntersectionObservers() {
  const observers: Array<{
    callback: IntersectionObserverCallback;
    targets: Set<Element>;
  }> = [];

  class MockIntersectionObserver {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds = [0];
    private readonly record: (typeof observers)[number];

    constructor(callback: IntersectionObserverCallback) {
      this.record = { callback, targets: new Set() };
      observers.push(this.record);
    }

    disconnect() {
      this.record.targets.clear();
    }

    observe(target: Element) {
      this.record.targets.add(target);
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }

    unobserve(target: Element) {
      this.record.targets.delete(target);
    }
  }

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

  return {
    trigger(target: Element, isIntersecting: boolean) {
      const observer = observers.find((candidate) =>
        candidate.targets.has(target),
      );

      if (!observer) {
        throw new Error("No IntersectionObserver is watching the target");
      }

      observer.callback(
        [
          {
            boundingClientRect: target.getBoundingClientRect(),
            intersectionRatio: isIntersecting ? 1 : 0,
            intersectionRect: target.getBoundingClientRect(),
            isIntersecting,
            rootBounds: null,
            target,
            time: 0,
          },
        ],
        {} as IntersectionObserver,
      );
    },
  };
}

function ReducedMotionProbe() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return <output>{String(prefersReducedMotion)}</output>;
}

function renderApp() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>,
  );
}

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.lang = "en";
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
    });
    mockMediaPreferences();
    mockIntersectionObservers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders the static hero composition", () => {
    const { container } = renderApp();
    const heroHeading = screen.getByRole("heading", {
      name: /Evindo Amanda/,
    });

    expect(heroHeading).toBeInTheDocument();
    expect(heroHeading.querySelector(".hero-name-primary")).toHaveTextContent(
      "Evindo",
    );
    expect(heroHeading.querySelector(".hero-name-accent")).toHaveTextContent(
      "Amanda",
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByTestId("navbar-logo-frame")).not.toHaveAttribute(
      "data-scrolled",
    );
    expect(
      screen.getByRole("link", { name: "Evindo Amanda — Home" }),
    ).toHaveAttribute("href", "/#home");
    expect(container.querySelector("#home")).toHaveAttribute(
      "aria-labelledby",
      "hero-heading",
    );
    expect(screen.getByTestId("navbar-blur-strip")).toHaveAttribute(
      "data-scroll-linked",
      "true",
    );
    expect(screen.getByTestId("navbar-blur-strip")).toHaveAttribute(
      "data-feathered",
      "true",
    );
    expect(screen.getByTestId("navbar-blur-strip")).not.toHaveAttribute(
      "data-active",
    );
    expect(screen.getByTestId("navbar-blur-strip")).toHaveClass(
      "bg-transparent",
    );
    expect(screen.getByTestId("bottom-blur-strip")).toHaveAttribute(
      "data-scroll-linked",
      "false",
    );
    expect(screen.getByTestId("bottom-blur-strip")).toHaveAttribute(
      "data-feathered",
      "true",
    );
    expect(screen.getByTestId("bottom-blur-strip")).toHaveClass(
      "bg-transparent",
      "bottom-0",
    );
    expect(
      screen
        .getByTestId("bottom-blur-strip")
        .querySelectorAll(".viewport-edge-blur-bottom-layer"),
    ).toHaveLength(3);
    expect(
      screen.queryByTestId("navbar-scroll-surface"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("navigation")).toHaveAttribute(
      "data-scrolled",
      "false",
    );
    const header = container.querySelector("header");

    expect(header).toHaveClass("pointer-events-none");
    expect(screen.getByTestId("navbar-logo-frame")).toHaveClass(
      "pointer-events-auto",
    );
    expect(screen.getByRole("navigation").parentElement).toHaveClass(
      "pointer-events-auto",
    );
    const aboutLink = screen.getByRole("link", { name: "About" });
    const projectsLink = screen.getByRole("link", { name: "Projects" });

    expect(aboutLink).toHaveAttribute("href", "/#about");
    expect(aboutLink).toHaveClass("hero-nav-item");
    expect(aboutLink).not.toHaveAttribute("aria-disabled");
    expect(projectsLink).toHaveAttribute("aria-disabled", "true");
    expect(projectsLink).toHaveAttribute("tabindex", "-1");
    expect(projectsLink).toHaveClass("hero-nav-item");
    expect(projectsLink).not.toHaveAttribute("href");
    expect(document.querySelector(".about-status")).toBeInTheDocument();
    expect(screen.getByAltText("Evindo Amanda")).toHaveAttribute(
      "src",
      "/logo-light.svg",
    );
    expect(
      screen.getByAltText(
        "Portrait of Evindo Amanda wearing a black suit and tie",
      ),
    ).toHaveAttribute("src", portraitAssets.light.fallbackSrc);
    expect(screen.getByTestId("scanner-background")).toHaveAttribute(
      "data-theme",
      "light",
    );
    expect(screen.getByTestId("scanner-background")).toHaveClass(
      "fixed",
      "pointer-events-none",
    );
    expect(
      container.querySelectorAll('[data-testid="scanner-background"]'),
    ).toHaveLength(1);
    expect(screen.queryByTestId("hero-bottom-fade")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("hero-progressive-blur"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("portrait-parallax")).toBeInTheDocument();
    expect(screen.getByTestId("portrait-overscan")).toBeInTheDocument();
    expect(container.querySelectorAll('img[src^="/portrait-"]')).toHaveLength(
      2,
    );
    expect(container.querySelectorAll("picture")).toHaveLength(2);
    expect(container.querySelectorAll("source")).toHaveLength(4);
    expect(
      container.querySelector('source[type="image/avif"]'),
    ).toHaveAttribute("srcset", portraitAssets.light.sources[0]?.srcSet);
    expect(
      container.querySelector('source[type="image/webp"]'),
    ).toHaveAttribute("srcset", portraitAssets.light.sources[1]?.srcSet);
    expect(
      screen.getByAltText(
        "Portrait of Evindo Amanda wearing a black suit and tie",
      ),
    ).toHaveAttribute("fetchpriority", "high");

    const github = screen.getByRole("link", {
      name: "GitHub — Evindo Amanda",
    });
    const instagram = screen.getByRole("link", {
      name: "Instagram — Evindo Amanda",
    });
    const email = screen.getByRole("link", { name: "Email Evindo Amanda" });
    const x = screen.getByRole("link", {
      name: "X — @yhvnz_",
    });

    expect(github).toHaveAttribute("href", "https://github.com/vinz25-coder");
    expect(github).toHaveAttribute("target", "_blank");
    expect(instagram).toHaveAttribute(
      "href",
      "https://www.instagram.com/evindoamanda_/",
    );
    expect(instagram).toHaveAttribute("target", "_blank");
    expect(email).toHaveAttribute("href", "mailto:evindoamandariza@gmail.com");
    expect(email).not.toHaveAttribute("target");
    expect(x).toHaveAttribute("href", "https://x.com/yhvnz_");
    expect(x).toHaveAttribute("target", "_blank");

    expect(screen.getByRole("link", { name: "VIEW MY WORK" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    const cvLink = screen.getByRole("link", { name: "VIEW CV" });

    expect(cvLink).toHaveAttribute("aria-disabled", "true");
    expect(cvLink.querySelector("svg")).not.toBeInTheDocument();
  });

  it("renders the editorial About section with metadata and principles", () => {
    const { container } = renderApp();
    const aboutSection = container.querySelector("#about");
    const aboutHeading = screen.getByRole("heading", {
      name: "I turn design into working code.",
    });

    expect(aboutSection).toHaveAttribute("aria-labelledby", "about-heading");
    expect(aboutSection).not.toHaveClass(
      "scroll-mt-24",
      "sm:scroll-mt-18",
      "lg:scroll-mt-[7.75rem]",
    );
    expect(
      screen.queryByTestId("about-progressive-blur"),
    ).not.toBeInTheDocument();
    expect(aboutHeading.parentElement?.parentElement).toHaveClass(
      "xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]",
      "xl:gap-[clamp(5rem,8vw,9rem)]",
    );
    expect(aboutSection?.querySelector(".about-details")).toHaveClass(
      "min-w-0",
      "xl:pl-[clamp(1rem,2vw,2.5rem)]",
    );
    expect(aboutHeading).toBeInTheDocument();
    expect(aboutHeading.querySelector(".about-heading-copy")).not.toHaveClass(
      "overflow-hidden",
      "whitespace-nowrap",
    );
    expect(screen.getByTestId("about-heading-accent")).toHaveTextContent(
      "code",
    );
    expect(screen.getByTestId("about-heading-accent")).toHaveClass(
      "text-accent-500",
      "italic",
    );
    expect(aboutHeading.querySelector('[style*="opacity: 0"]')).toBeNull();
    const aboutLabel = screen.getByTestId("about-section-label");

    expect(aboutLabel).toHaveClass("about-section-label");
    expect(screen.getByTestId("about-label-title")).toHaveTextContent(
      "About Me",
    );
    expect(aboutLabel).not.toHaveTextContent("01 /");
    expect(aboutLabel.querySelectorAll(".about-label-part")).toHaveLength(1);
    expect(screen.getByText("Focus")).toBeInTheDocument();
    expect(screen.getByText("Precise & Accessible")).toBeInTheDocument();
    expect(aboutSection).toHaveTextContent("Indonesia");
    expect(screen.getByText("How I work")).toBeInTheDocument();
    expect(screen.getByText("Design to Code")).toBeInTheDocument();
    expect(screen.getByText("Meaningful Interaction")).toBeInTheDocument();
    expect(screen.getByText("Performance by Default")).toBeInTheDocument();
    expect(screen.getByTestId("about-meta-panel")).toHaveClass(
      "about-glass-panel",
    );
    expect(screen.getByTestId("about-principles-panel")).toHaveClass(
      "about-glass-panel",
    );
    expect(screen.getByTestId("about-meta-panel").tagName).toBe("DL");
    expect(screen.getByTestId("about-principles-panel").tagName).toBe("OL");
    expect(
      Array.from(
        screen
          .getByTestId("about-principles-panel")
          .querySelectorAll("[data-principle-number]"),
      ).map((item) => item.textContent),
    ).toEqual(["01", "02", "03"]);
    expect(
      screen
        .getByTestId("about-principles-panel")
        .querySelector(".bg-accent-500"),
    ).toBeNull();
    const quote = screen.getByTestId("about-quote");
    const englishQuote =
      "I turn ideas into interfaces. I don't just build screens — I build experiences that respond, move, and feel alive. Because a great product isn't just seen, it's felt.";

    expect(quote).toHaveTextContent(englishQuote);
    expect(quote).toHaveClass(
      "text-left",
      "max-w-[24ch]",
      "about-quote",
      "text-[1.625rem]",
      "text-text-primary",
    );
    expect(quote).toHaveAttribute("data-scroll-highlight", "true");
    expect(quote.querySelectorAll("[data-about-quote-word]")).toHaveLength(
      englishQuote.split(/\s+/).length,
    );
    expect(
      quote.querySelectorAll('[data-about-quote-emphasis="true"]'),
    ).toHaveLength(2);
    expect(
      quote.compareDocumentPosition(
        screen.getByRole("heading", {
          name: "I turn design into working code.",
        }),
      ) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
    expect(aboutSection?.querySelectorAll("ol > li")).toHaveLength(3);
    expect(aboutSection?.querySelector("img")).toBeNull();
  });

  it("activates About navigation only while the About section is current", () => {
    const intersections = mockIntersectionObservers();
    const { container } = renderApp();
    const aboutSection = container.querySelector("#about");
    const aboutLink = screen.getByRole("link", { name: "About" });

    expect(aboutSection).not.toBeNull();
    expect(aboutLink).toHaveAttribute("data-active", "false");
    expect(aboutLink).not.toHaveClass("active");
    expect(aboutLink).not.toHaveAttribute("aria-current");

    act(() => intersections.trigger(aboutSection as Element, true));

    expect(aboutLink).toHaveAttribute("data-active", "true");
    expect(aboutLink).toHaveClass("active");
    expect(aboutLink).toHaveAttribute("aria-current", "page");

    act(() => intersections.trigger(aboutSection as Element, false));

    expect(aboutLink).toHaveAttribute("data-active", "false");
    expect(aboutLink).not.toHaveClass("active");
    expect(aboutLink).not.toHaveAttribute("aria-current");
  });

  it("renders the Skills technical index with official assets", () => {
    const { container } = renderApp();
    const skillsSection = container.querySelector("#skills");

    expect(skillsSection).toHaveAttribute("aria-labelledby", "skills-heading");
    expect(
      screen.getByRole("heading", {
        name: "Tools and technologies I work with.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("skills-index")).toBeInTheDocument();
    expect(screen.getByTestId("skills-section-label")).toHaveClass(
      "skills-section-label",
    );
    expect(
      screen
        .getByTestId("skills-section-label")
        .querySelector(".skills-label-part"),
    ).toHaveTextContent("Skills");
    expect(skillsSection?.querySelectorAll("[data-skill]")).toHaveLength(19);
    expect(skillsSection?.querySelectorAll("h3")).toHaveLength(5);
    expect(
      skillsSection?.querySelector('[data-skill="react"]'),
    ).not.toHaveTextContent("Frontend");
    expect(
      skillsSection?.querySelector('[data-skill="supabase"]'),
    ).not.toHaveTextContent("Planned");
    expect(
      skillsSection?.querySelector('[data-skill="figma"]'),
    ).toBeInTheDocument();
    expect(
      skillsSection?.querySelector('[data-skill="figma"] img'),
    ).toHaveAttribute("src", "/skills/figma.svg");
    expect(skillsSection?.querySelector('[data-skill="react"]')).toHaveStyle({
      "--skill-brand": "#61DAFB",
      "--skill-trace": "#61DAFB",
    });
    expect(skillsSection?.querySelector('[data-skill="motion"]')).toHaveStyle({
      "--skill-brand": "#FFF312",
      "--skill-trace": "#FFF312",
    });
    expect(
      skillsSection?.querySelector('[data-skill="eslint"]'),
    ).not.toBeInTheDocument();
    expect(
      skillsSection?.querySelector('[data-skill="prettier"]'),
    ).not.toBeInTheDocument();
    expect(
      skillsSection?.querySelector('[data-skill="npm"]'),
    ).not.toBeInTheDocument();
    expect(
      skillsSection?.querySelector('[data-skill="motion"] img'),
    ).toHaveAttribute("src", "/skills/motion.svg");
    expect(
      skillsSection?.querySelector('[data-skill="react-bits"] img'),
    ).toHaveAttribute("src", "/skills/react-bits.png");
    expect(
      skillsSection?.querySelector('[data-skill="react-bits"]'),
    ).toHaveStyle({ "--skill-trace": "var(--color-text-primary)" });
    expect(skillsSection?.querySelector('[data-skill="figma"]')).toHaveStyle({
      "--skill-trace": "var(--color-text-primary)",
    });
    expect(
      skillsSection?.querySelector('[data-skill="github"] .skill-index-icon'),
    ).toHaveClass("text-text-primary");
    expect(skillsSection?.querySelector('[data-skill="github"]')).toHaveStyle({
      "--skill-trace": "var(--color-text-primary)",
    });
    expect(
      skillsSection?.querySelector('[data-skill="chatgpt"] img'),
    ).toHaveAttribute("src", "/skills/chatgpt.png");
    expect(skillsSection?.querySelector('[data-skill="chatgpt"]')).toHaveStyle({
      "--skill-trace": "var(--color-text-primary)",
    });
    expect(
      skillsSection?.querySelector('[data-skill="codex"] img'),
    ).toHaveAttribute("src", "/skills/codex.png");
    expect(
      skillsSection?.querySelector('[data-skill="claude"] img'),
    ).toHaveAttribute("src", "/skills/claude.svg");
    expect(
      skillsSection?.querySelector('[data-skill="opencode"] img'),
    ).toHaveAttribute("src", "/skills/opencode.svg");
    expect(skillsSection?.querySelector('[data-skill="opencode"]')).toHaveStyle(
      { "--skill-trace": "var(--color-text-primary)" },
    );
    expect(
      skillsSection?.querySelector('[data-skill="hermes"] img'),
    ).toHaveAttribute("src", "/skills/hermes.png");
    expect(skillsSection?.querySelector('[data-skill="hermes"]')).toHaveStyle({
      "--skill-trace": "var(--color-text-primary)",
    });
    expect(
      skillsSection?.querySelector('[data-skill="9router"] img'),
    ).toHaveAttribute("src", "/skills/9router.svg");
    const skillsFilter = screen.getByRole("tablist", {
      name: "Filter skills by category",
    });
    expect(skillsFilter).toHaveClass("flex-nowrap");
    expect(skillsFilter).not.toHaveClass("sm:flex-wrap");
  });

  it("filters Skills with accessible keyboard tabs", async () => {
    renderApp();
    const allTab = screen.getByRole("tab", { name: "All" });
    const frontendTab = screen.getByRole("tab", { name: "Frontend" });
    const stylingTab = screen.getByRole("tab", { name: "Styling & Motion" });
    const aiTab = screen.getByRole("tab", { name: "AI Tools" });

    expect(allTab).toHaveAttribute("aria-selected", "true");
    expect(allTab).toHaveAttribute("tabindex", "0");
    expect(frontendTab).toHaveAttribute("tabindex", "-1");

    fireEvent.keyDown(allTab, { key: "ArrowRight" });

    expect(frontendTab).toHaveFocus();
    expect(frontendTab).toHaveAttribute("aria-selected", "true");

    fireEvent.click(stylingTab);

    await waitFor(() => {
      expect(
        screen.getByTestId("skills-index").querySelectorAll("[data-skill]"),
      ).toHaveLength(4);
    });
    expect(screen.getByText("React Bits")).toBeInTheDocument();
    expect(screen.queryByText("Supabase")).not.toBeInTheDocument();

    fireEvent.click(aiTab);

    await waitFor(() => {
      expect(
        screen.getByTestId("skills-index").querySelectorAll("[data-skill]"),
      ).toHaveLength(6);
    });
    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getByText("9Router")).toBeInTheDocument();
  });

  it("collapses the All preview only on mobile", () => {
    mockMediaPreferences({ desktopViewport: false });
    renderApp();
    const index = screen.getByTestId("skills-index");
    const expandButton = screen.getByRole("button", { name: "View More" });

    expect(index).toHaveAttribute("data-mobile-expanded", "false");
    expect(index.querySelectorAll(".skill-mobile-overflow")).toHaveLength(10);
    expect(expandButton).toHaveClass("sm:hidden");
    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    expect(expandButton).toHaveAttribute("aria-controls", "skills-index-list");

    fireEvent.click(expandButton);

    expect(index).toHaveAttribute("data-mobile-expanded", "true");
    expect(screen.getByRole("button", { name: "Show Less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    fireEvent.click(screen.getByRole("tab", { name: "Frontend" }));

    expect(
      screen.queryByRole("button", { name: "Show Less" }),
    ).not.toBeInTheDocument();
  });

  it("keeps About active while Skills is the current child section", () => {
    const intersections = mockIntersectionObservers();
    const { container } = renderApp();
    const skillsSection = container.querySelector("#skills");
    const aboutLink = screen.getByRole("link", { name: "About" });

    act(() => intersections.trigger(skillsSection as Element, true));

    expect(aboutLink).toHaveAttribute("data-active", "true");
    expect(aboutLink).toHaveClass("active");
    expect(aboutLink).toHaveAttribute("aria-current", "page");
  });

  it("highlights only Skills in the mobile menu when Skills is current", () => {
    mockMediaPreferences({ desktopViewport: false });
    const intersections = mockIntersectionObservers();
    const { container } = renderApp();
    const skillsSection = container.querySelector("#skills");

    act(() => intersections.trigger(skillsSection as Element, true));
    fireEvent.click(screen.getByTestId("mobile-navigation-toggle"));

    const aboutLink = screen.getByRole("link", { name: "About" });
    const skillsLink = screen.getByRole("link", { name: "Skills" });

    expect(aboutLink).toHaveAttribute("data-active", "false");
    expect(aboutLink).not.toHaveClass("active");
    expect(aboutLink).not.toHaveAttribute("aria-current");
    expect(skillsLink).toHaveAttribute("data-active", "true");
    expect(skillsLink).toHaveClass("active");
    expect(skillsLink).toHaveAttribute("aria-current", "page");
  });

  it("renders the Experience record after Skills", () => {
    const { container } = renderApp();
    const skillsSection = container.querySelector("#skills");
    const experienceSection = container.querySelector("#experience");

    expect(experienceSection).toHaveAttribute(
      "aria-labelledby",
      "experience-heading",
    );
    expect(
      screen.getByRole("heading", {
        name: "Experience",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("experience-record")).toHaveAttribute(
      "data-experience-id",
      "owner-operated-dashboard",
    );
    expect(experienceSection).toHaveTextContent("Nov 2025 – Present");
    expect(experienceSection).toHaveTextContent("Independent Web Developer");
    expect(experienceSection).toHaveTextContent("Internal Business Project");
    expect(experienceSection).toHaveTextContent("ALAM BARU");
    expect(experienceSection).toHaveTextContent(
      "Custom glass & aluminum fabrication, complemented by ornamental & predator fish retail",
    );
    expect(experienceSection).toHaveTextContent(
      "Internal Dashboard · North Sumatra, Indonesia",
    );
    expect(experienceSection?.querySelectorAll("ul > li")).toHaveLength(3);
    expect(
      experienceSection?.querySelector(".experience-rail"),
    ).toBeInTheDocument();
    expect(
      experienceSection?.querySelector(".experience-glass-panel"),
    ).toHaveClass("rounded-2xl", "border");
    expect(
      experienceSection?.querySelector(".experience-record"),
    ).not.toHaveClass("border-y");
    expect(experienceSection?.querySelector("img")).toBeNull();
    expect(skillsSection).not.toBeNull();
    expect(experienceSection).not.toBeNull();
    expect(
      (skillsSection as Element).compareDocumentPosition(
        experienceSection as Node,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders the scroll-only Work With Me CTA after Experience", () => {
    const { container } = renderApp();
    const experienceSection = container.querySelector("#experience");
    const heading = screen.getByRole("heading", { name: "Work with me" });
    const workWithMeSection = heading.closest("section");
    const getInTouch = screen.getByRole("link", { name: "Get in touch" });
    const emailDirectly = screen.getByRole("link", {
      name: "Email directly",
    });

    expect(workWithMeSection).toHaveAttribute("id", "work-with-me");
    expect(heading).toHaveAttribute("data-heading", "Work with me");
    expect(
      heading.querySelector(".work-with-me-heading-accent"),
    ).toHaveTextContent("me");
    expect(workWithMeSection).toHaveTextContent("Let's build something");
    expect(workWithMeSection).toHaveTextContent(
      "I'm available for selected projects — web products, dashboards, and product-focused frontend work.",
    );
    expect(getInTouch).toHaveAttribute("href", "/contact");
    expect(getInTouch).not.toHaveAttribute("aria-disabled");
    expect(emailDirectly).toHaveAttribute(
      "href",
      "mailto:evindoamandariza@gmail.com",
    );
    expect(experienceSection).not.toBeNull();
    expect(workWithMeSection).not.toBeNull();
    expect(
      (experienceSection as Element).compareDocumentPosition(
        workWithMeSection as Node,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders the standalone Contact page with a working project form", async () => {
    window.history.replaceState({}, "", "/contact");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { container } = renderApp();

    expect(
      screen.getByRole("heading", { name: "Let's build something useful." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Project Inquiry" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Contact", { selector: ".contact-label-part" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("05 / Contact")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Evindo Amanda/ }),
    ).not.toBeInTheDocument();
    expect(container.querySelector(".tablet-social-rail")).toBeInTheDocument();
    expect(screen.getByTestId("scanner-background")).toBeInTheDocument();
    expect(screen.queryByTestId("hero-nav-contact")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/#about",
    );
    expect(
      screen.getByRole("link", { name: "Evindo Amanda — Home" }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /WhatsApp/i })).toHaveAttribute(
      "href",
      expect.stringContaining("wa.me/628999925053"),
    );
    expect(container.querySelectorAll(".contact-direct-link")).toHaveLength(6);
    expect(container.querySelector(".contact-direct-link")).not.toHaveClass(
      "border-b",
    );
    expect(screen.getByRole("link", { name: /WhatsApp/i })).toHaveAttribute(
      "data-brand",
      "whatsapp",
    );
    expect(
      container.querySelector('.contact-direct-link[data-brand="instagram"]'),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Telegram/i })).toHaveAttribute(
      "href",
      "https://t.me/yeahvnz",
    );
    expect(screen.getByRole("link", { name: /Telegram/i })).toHaveTextContent(
      "@yeahvnz",
    );
    expect(
      screen.getByTestId("contact-icon-email").querySelector("path"),
    ).toHaveAttribute("d");
    expect(screen.getByTestId("contact-icon-whatsapp")).toBeInTheDocument();
    expect(screen.getByTestId("contact-icon-telegram")).toBeInTheDocument();
    expect(screen.getByTestId("contact-icon-github")).toBeInTheDocument();
    expect(screen.getByTestId("contact-icon-x")).toBeInTheDocument();
    expect(screen.getByTestId("contact-icon-instagram")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));
    expect(screen.getByText("Enter your name.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Project type"), {
      target: { value: "web-product" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "I would like to discuss a focused web product." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Message sent. Thank you for reaching out.",
    );
  });

  it("explains when contact email delivery is not configured", async () => {
    window.history.replaceState({}, "", "/contact");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            code: "DELIVERY_UNAVAILABLE",
          }),
          { status: 503 },
        ),
      ),
    );
    renderApp();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Project type"), {
      target: { value: "web-product" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "I would like to discuss a focused web product." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email delivery is not configured yet.",
    );
  });

  it("navigates from Contact to About without reloading the document", async () => {
    window.history.replaceState({}, "", "/contact");
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    renderApp();

    const projectsItem = screen.getByRole("link", { name: "Projects" });
    expect(projectsItem).toHaveAttribute("aria-disabled", "true");
    expect(projectsItem).not.toHaveAttribute("href");

    fireEvent.click(screen.getByRole("link", { name: "About" }));

    await waitFor(() => {
      expect(window.location.pathname).toBe("/");
      expect(window.location.hash).toBe("#about");
      expect(document.querySelector("#about")).toBeInTheDocument();
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    });
  });

  it("scrolls to About on every Home navigation click even when the hash is unchanged", () => {
    window.history.replaceState({}, "", "/#about");
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    renderApp();
    scrollIntoView.mockClear();

    fireEvent.click(screen.getByRole("link", { name: "About" }));

    expect(window.location.pathname).toBe("/");
    expect(window.location.hash).toBe("#about");
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    expect(scrollIntoView.mock.contexts[0]).toBe(
      document.querySelector("#about [data-section-start]"),
    );
  });

  it.each(["about", "skills", "experience"])(
    "places the %s content start at the navigation target",
    (sectionId) => {
      const { container } = renderApp();
      const section = container.querySelector(`#${sectionId}`);

      expect(section?.querySelector(":scope > [data-section-start]")).toBe(
        section?.firstElementChild,
      );
    },
  );

  it("navigates from the Contact hamburger to the selected Home section", async () => {
    window.history.replaceState({}, "", "/contact");
    mockMediaPreferences({ desktopViewport: false });
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    renderApp();

    fireEvent.click(screen.getByTestId("mobile-navigation-toggle"));
    fireEvent.click(screen.getByRole("link", { name: "Experience" }));

    await waitFor(() => {
      expect(window.location.pathname).toBe("/");
      expect(window.location.hash).toBe("#experience");
      expect(document.querySelector("#experience")).toBeInTheDocument();
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    });
  });

  it("renders the particle signature footer after Work With Me", () => {
    const { container } = renderApp();
    const workWithMeSection = container.querySelector("#work-with-me");
    const footer = screen.getByRole("contentinfo", {
      name: "Evindo Amanda footer",
    });
    const wordmark = screen.getByText("EVINDO AMANDA.");

    expect(workWithMeSection).not.toBeNull();
    expect(
      (workWithMeSection as Element).compareDocumentPosition(footer) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(wordmark).toHaveClass("particle-text__sr");
    expect(screen.getByTestId("footer-location")).toHaveTextContent(
      "NORTH SUMATRA, INDONESIA",
    );
    expect(screen.getByTestId("footer-time-separator")).toHaveTextContent("·");
    expect(footer).toHaveTextContent("(GMT+7)");
    expect(footer).toHaveTextContent("© 2026 Evindo A. All rights reserved.");
    expect(footer.querySelector("canvas")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByTestId("footer-copyright")).toHaveTextContent(
      "© 2026 Evindo A. All rights reserved.",
    );
  });

  it("keeps footer particles interactive for touch pointers", () => {
    mockMediaPreferences({ desktopViewport: false, pointerFine: false });
    const context = {} as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context,
    );
    const addEventListener = vi.spyOn(
      HTMLCanvasElement.prototype,
      "addEventListener",
    );

    class MockResizeObserver {
      disconnect() {}
      observe() {}
      unobserve() {}
    }

    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    const { container } = renderApp();

    expect(container.querySelector(".particle-text")).toBeInTheDocument();
    expect(addEventListener).toHaveBeenCalledWith(
      "pointerdown",
      expect.any(Function),
    );
    expect(addEventListener).toHaveBeenCalledWith(
      "pointermove",
      expect.any(Function),
    );
    expect(addEventListener).toHaveBeenCalledWith(
      "pointerup",
      expect.any(Function),
    );
    expect(addEventListener).toHaveBeenCalledWith(
      "pointercancel",
      expect.any(Function),
    );

    addEventListener.mockRestore();
  });

  it("keeps About active while Work With Me is the current subsection", () => {
    const intersections = mockIntersectionObservers();
    const { container } = renderApp();
    const workWithMeSection = container.querySelector("#work-with-me");
    const aboutLink = screen.getByRole("link", { name: "About" });

    act(() => intersections.trigger(workWithMeSection as Element, true));

    expect(aboutLink).toHaveAttribute("data-active", "true");
    expect(aboutLink).toHaveClass("active");
    expect(aboutLink).toHaveAttribute("aria-current", "page");
  });

  it("highlights About in the mobile menu while Work With Me is current", () => {
    mockMediaPreferences({ desktopViewport: false });
    const intersections = mockIntersectionObservers();
    const { container } = renderApp();
    const workWithMeSection = container.querySelector("#work-with-me");

    act(() => intersections.trigger(workWithMeSection as Element, true));
    fireEvent.click(screen.getByTestId("mobile-navigation-toggle"));

    const aboutLink = screen.getByRole("link", { name: "About" });
    const contactItem = screen.getByRole("link", { name: "Contact" });

    expect(aboutLink).toHaveAttribute("data-active", "true");
    expect(aboutLink).toHaveClass("active");
    expect(aboutLink).toHaveAttribute("aria-current", "page");
    expect(contactItem).toHaveAttribute("href", "/contact");
    expect(contactItem).not.toHaveAttribute("aria-disabled");
  });

  it("keeps About active while Experience is the current child section", () => {
    const intersections = mockIntersectionObservers();
    const { container } = renderApp();
    const experienceSection = container.querySelector("#experience");
    const aboutLink = screen.getByRole("link", { name: "About" });

    act(() => intersections.trigger(experienceSection as Element, true));

    expect(aboutLink).toHaveAttribute("data-active", "true");
    expect(aboutLink).toHaveClass("active");
    expect(aboutLink).toHaveAttribute("aria-current", "page");
  });

  it("highlights only Experience in the mobile menu when Experience is current", () => {
    mockMediaPreferences({ desktopViewport: false });
    const intersections = mockIntersectionObservers();
    const { container } = renderApp();
    const experienceSection = container.querySelector("#experience");

    act(() => intersections.trigger(experienceSection as Element, true));
    fireEvent.click(screen.getByTestId("mobile-navigation-toggle"));

    const aboutLink = screen.getByRole("link", { name: "About" });
    const skillsLink = screen.getByRole("link", { name: "Skills" });
    const experienceLink = screen.getByRole("link", { name: "Experience" });

    expect(aboutLink).toHaveAttribute("data-active", "false");
    expect(skillsLink).toHaveAttribute("data-active", "false");
    expect(experienceLink).toHaveAttribute("href", "/#experience");
    expect(experienceLink).toHaveAttribute("data-active", "true");
    expect(experienceLink).toHaveClass("active");
    expect(experienceLink).toHaveAttribute("aria-current", "page");
  });

  it("renders the rotating status as metadata after Based In", () => {
    vi.useFakeTimers();
    const { container } = renderApp();
    const liveStatus = screen.getByLabelText("Let's collaborate");
    const statusDot = container.querySelector(".about-status-dot");
    const aboutStatus = container.querySelector<HTMLElement>(".about-status");
    const basedIn = screen.getByText("North Sumatera, Indonesia");
    const statusLabel = screen.getByText("Status");

    expect(liveStatus).toHaveAttribute("aria-atomic", "true");
    expect(liveStatus).toHaveAttribute("aria-live", "polite");
    expect(liveStatus).toHaveAttribute("aria-atomic", "true");
    expect(liveStatus.parentElement).toHaveClass(
      "about-status-text",
      "whitespace-normal",
      "sm:whitespace-nowrap",
    );
    const typingText = container.querySelector(".about-status-typing");

    expect(typingText).toHaveAttribute("data-message", "Let's collaborate");
    expect(typingText).toHaveClass(
      "about-status-typing",
      "whitespace-normal",
      "sm:whitespace-nowrap",
    );
    expect(aboutStatus).toHaveClass(
      "whitespace-normal",
      "sm:whitespace-nowrap",
    );
    expect(statusLabel.closest("div")?.previousElementSibling).toBe(
      basedIn.closest("div"),
    );
    expect(basedIn.closest("dd")).toHaveClass(
      "whitespace-normal",
      "sm:whitespace-nowrap",
    );
    expect(basedIn.parentElement?.parentElement).toHaveClass(
      "whitespace-normal",
      "sm:whitespace-nowrap",
    );
    expect(statusLabel.closest("div")).toContainElement(aboutStatus);
    expect(aboutStatus?.parentElement).toHaveClass(
      "font-display",
      "text-base",
      "font-semibold",
    );
    expect(aboutStatus?.parentElement).not.toHaveClass("sm:text-lg");
    expect(aboutStatus).toHaveAttribute("data-status", "available");
    expect(statusDot).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(rotatingStatusMotion.intervalMs);
    });

    expect(screen.getByLabelText("Open for work")).toBeInTheDocument();
    expect(typingText).toHaveAttribute("data-message", "Open for work");

    act(() => {
      vi.advanceTimersByTime("Open for work".length * 32);
    });

    expect(container.querySelector(".about-status-typed")).toHaveTextContent(
      "Open for work",
    );
    expect(statusDot).toBeInTheDocument();
  });

  it("pauses status rotation while the About status is outside the viewport", () => {
    vi.useFakeTimers();
    const intersections = mockIntersectionObservers();
    renderApp();
    const aboutStatus = document.querySelector(".about-status");

    expect(aboutStatus).not.toBeNull();

    act(() => intersections.trigger(aboutStatus as Element, false));
    act(() => {
      vi.advanceTimersByTime(rotatingStatusMotion.intervalMs);
    });

    expect(screen.getByLabelText("Let's collaborate")).toBeInTheDocument();
    expect(screen.queryByLabelText("Open for work")).not.toBeInTheDocument();

    act(() => intersections.trigger(aboutStatus as Element, true));
    act(() => {
      vi.advanceTimersByTime(rotatingStatusMotion.intervalMs);
    });

    expect(screen.getByLabelText("Open for work")).toBeInTheDocument();
  });

  it("renders busy and unavailable as static manual status states", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <ThemeProvider>
        <LanguageProvider>
          <AboutStatus status="busy" />
        </LanguageProvider>
      </ThemeProvider>,
    );
    const busyStatus = document.querySelector(".about-status");

    expect(busyStatus).toHaveAttribute("data-status", "busy");
    expect(screen.getByLabelText("Currently busy")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(rotatingStatusMotion.intervalMs * 2);
    });

    expect(screen.getByLabelText("Currently busy")).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <LanguageProvider>
          <AboutStatus status="unavailable" />
        </LanguageProvider>
      </ThemeProvider>,
    );

    expect(document.querySelector(".about-status")).toHaveAttribute(
      "data-status",
      "unavailable",
    );
    expect(
      screen.getByLabelText("Not available right now"),
    ).toBeInTheDocument();
  });

  it("previews discussions and reviews before opening Guestbook", async () => {
    const { container } = renderApp();
    const trigger = screen.getByRole("button", {
      name: "Open Guestbook preview",
    });
    fireEvent.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "Guestbook Preview" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Discussions" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Reviews" }));
    expect(await screen.findByText("No reviews yet.")).toBeInTheDocument();
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);

    const openGuestbook = screen.getByRole("link", { name: "Open Guestbook" });
    expect(openGuestbook).toHaveAttribute("href", "/guestbook");
    fireEvent.click(openGuestbook);
    expect(
      await screen.findByRole("heading", { name: "Visitor Perspectives." }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open Guestbook preview" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.getByText(/No conversations yet/)).toBeInTheDocument();
  });

  it("links Guestbook navigation back to Home sections", () => {
    window.history.replaceState({}, "", "/guestbook");
    renderApp();

    expect(screen.getByTestId("navbar-logo-frame")).toHaveAttribute(
      "href",
      "/#home",
    );
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/#about",
    );
  });

  it("keeps the mobile drawer focused on navigation", async () => {
    mockMediaPreferences({ desktopViewport: false });
    const { container } = renderApp();

    expect(
      screen.queryByRole("link", { name: "Guestbook" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Social profiles")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("mobile-navigation-toggle"));

    const drawer = document.getElementById(
      screen
        .getByTestId("mobile-navigation-toggle")
        .getAttribute("aria-controls") ?? "",
    );
    const menuLabels = Array.from(
      drawer?.querySelectorAll(".hero-mobile-menu-item") ?? [],
      (item) => item.textContent,
    );

    expect(menuLabels).toEqual([
      "About",
      "Skills",
      "Experience",
      "Projects",
      "Contact",
      "Guestbook",
    ]);
    expect(drawer?.querySelectorAll(".hero-mobile-social-link")).toHaveLength(
      0,
    );
    expect(
      container.querySelector(".mobile-social-nav"),
    ).not.toBeInTheDocument();

    const guestbookLink = screen.getByRole("link", { name: "Guestbook" });
    expect(guestbookLink).toHaveAttribute("href", "/guestbook");
    fireEvent.click(guestbookLink);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Visitor Perspectives." }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("mobile-navigation-toggle")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
  });

  it("marks Guestbook as current in the mobile drawer", () => {
    mockMediaPreferences({ desktopViewport: false });
    window.history.replaceState({}, "", "/guestbook");
    renderApp();

    fireEvent.click(screen.getByTestId("mobile-navigation-toggle"));
    const guestbookLink = screen.getByRole("link", { name: "Guestbook" });
    expect(guestbookLink).toHaveAttribute("aria-current", "page");
    expect(guestbookLink).toHaveAttribute("data-active", "true");
    expect(guestbookLink).toHaveClass("active");
    expect(screen.getByRole("link", { name: "About" })).not.toHaveClass(
      "active",
    );
  });

  it("does not render the floating preview on the Guestbook route", () => {
    window.history.replaceState({}, "", "/guestbook");
    const { container } = renderApp();

    expect(container.querySelector(".floating-chat-root")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open Guestbook preview" }),
    ).not.toBeInTheDocument();
  });

  it("keeps widget hide controls out of tablet and desktop layouts", () => {
    mockMediaPreferences({ desktopViewport: true });
    const { container } = renderApp();
    const chatRoot = container.querySelector(".floating-chat-root");

    expect(
      screen.getByRole("button", { name: "Open Guestbook preview" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Guestbook preview" }),
    ).toHaveClass("size-14", "sm:size-16", "lg:size-14");
    expect(chatRoot).toHaveClass("sm:right-6", "sm:bottom-6");
    expect(
      screen.queryByRole("button", { name: "Hide chat widget" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show chat widget" }),
    ).not.toBeInTheDocument();
  });

  it("enables the glass cursor only for fine pointers and reacts to controls", () => {
    mockMediaPreferences({ pointerFine: true });
    renderApp();

    const cursor = screen.getByTestId("custom-cursor");
    const themeToggle = screen.getByRole("button", {
      name: "Switch to dark theme",
    });

    expect(document.documentElement).toHaveClass("custom-cursor-active");
    expect(cursor).toHaveAttribute("data-theme", "light");

    fireEvent.pointerMove(themeToggle, { clientX: 120, clientY: 80 });

    expect(cursor).toHaveAttribute("data-visible", "true");
    expect(cursor).toHaveAttribute("data-interactive", "true");

    fireEvent.pointerMove(document.body, { clientX: 180, clientY: 120 });

    expect(cursor).toHaveAttribute("data-interactive", "false");

    fireEvent.click(themeToggle);

    expect(cursor).toHaveAttribute("data-theme", "dark");
  });

  it("does not render the custom cursor for touch or reduced motion", () => {
    const { unmount } = renderApp();

    expect(screen.queryByTestId("custom-cursor")).not.toBeInTheDocument();

    unmount();
    mockMediaPreferences({ pointerFine: true, prefersReducedMotion: true });
    const reducedMotionRender = renderApp();

    expect(screen.queryByTestId("custom-cursor")).not.toBeInTheDocument();

    reducedMotionRender.unmount();
    mockMediaPreferences({ desktopViewport: false, pointerFine: true });
    renderApp();

    expect(screen.queryByTestId("custom-cursor")).not.toBeInTheDocument();
  });

  it("moves the hero portrait with a fine pointer", async () => {
    mockMediaPreferences({ pointerFine: true });
    const { container } = renderApp();
    const hero = container.querySelector("#home");
    const portrait = screen.getByTestId("portrait-parallax");

    expect(hero).not.toBeNull();

    fireEvent.pointerMove(hero as Element, {
      clientX: window.innerWidth,
      clientY: window.innerHeight,
    });

    await waitFor(() => {
      expect(portrait.style.transform).not.toBe(
        "translateX(0px) translateY(0px)",
      );
    });
  });

  it("switches the root token scope and persists a manual choice", () => {
    renderApp();

    const toggle = screen.getByRole("button", {
      name: "Switch to dark theme",
    });

    fireEvent.click(toggle);

    expect(document.documentElement).toHaveClass("dark");
    expect(screen.getByTestId("scanner-background")).toHaveAttribute(
      "data-theme",
      "dark",
    );
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(
      screen.getByAltText(
        "Portrait of Evindo Amanda wearing a black suit and tie",
      ),
    ).toHaveAttribute("src", portraitAssets.dark.fallbackSrc);
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
  });

  it("restores a saved theme", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");

    renderApp();

    expect(document.documentElement).toHaveClass("dark");
  });

  it("uses the system preference without persisting it as a manual choice", () => {
    mockMediaPreferences({ prefersDark: true });

    renderApp();

    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("removes decorative movement when reduced motion is preferred", () => {
    mockMediaPreferences({ pointerFine: true, prefersReducedMotion: true });

    render(<ReducedMotionProbe />);

    expect(screen.getByText("true")).toBeInTheDocument();
    expect(getEntranceMotion(entranceTimings.heading, true).initial).toEqual({
      opacity: 0,
      y: 0,
    });
    expect(getEntranceMotion(entranceTimings.heading, false).initial.y).toBe(
      16,
    );
    expect(getPortraitThemeTransition(true).duration).toBe(0.2);
    expect(getPortraitThemeTransition(false).duration).toBe(0.45);

    renderApp();

    expect(screen.getByTestId("about-quote")).toHaveTextContent(
      "I turn ideas into interfaces. I don't just build screens — I build experiences that respond, move, and feel alive. Because a great product isn't just seen, it's felt.",
    );
    expect(
      screen
        .getByTestId("about-quote")
        .querySelector("[data-about-quote-word]"),
    ).toBeNull();
  });

  it("switches the hero to Indonesian and persists the choice", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Choose language. Current language: English",
      }),
    );
    fireEvent.click(
      screen.getByRole("menuitemradio", {
        name: "Switch language to Indonesian",
      }),
    );

    expect(document.documentElement).toHaveAttribute("lang", "id");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("id");
    expect(screen.getByText("Pengembang Front-End")).toBeInTheDocument();
    expect(screen.getByText("Lihat Karya Saya")).toBeInTheDocument();
    expect(screen.getByLabelText("Mari berkolaborasi")).toBeInTheDocument();
    expect(document.querySelector(".about-status")).toHaveAttribute(
      "data-status",
      "available",
    );
    expect(
      screen.getByRole("heading", {
        name: "Saya mengubah desain menjadi kode yang berfungsi.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("about-heading-accent")).toHaveTextContent(
      "kode",
    );
    expect(screen.getByTestId("about-section-label")).toHaveTextContent(
      "Tentang Saya",
    );
    expect(
      screen.getByRole("link", { name: "Evindo Amanda — Beranda" }),
    ).toHaveAttribute("href", "/#home");
    expect(screen.getByText("Cara saya bekerja")).toBeInTheDocument();
    expect(screen.getByText("Interaksi Bermakna")).toBeInTheDocument();
    expect(screen.getByTestId("about-quote")).toHaveTextContent(
      "Saya mengubah ide menjadi antarmuka. Bukan sekadar membangun tampilan, tapi menciptakan pengalaman yang responsif, bergerak, dan terasa hidup. Karena produk yang hebat bukan hanya dilihat, tapi dirasakan.",
    );
    expect(
      screen.getByRole("heading", {
        name: "Tools dan teknologi yang saya gunakan.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Semua" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByText("Selalu belajar, selalu berkembang."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Lihat Selengkapnya" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("heading", {
        name: "Pengalaman",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("experience-record")).toHaveTextContent(
      "Nov 2025 – Sekarang",
    );
    expect(screen.getByTestId("experience-record")).toHaveTextContent(
      "Pengembang Web Independen",
    );
    expect(
      screen.getByText(
        "Mengimplementasikan pemantauan omzet dan laba secara real-time dengan visualisasi tren serta rincian performa setiap kategori.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Buka pratinjau Buku Tamu" }),
    ).toBeInTheDocument();
  });

  it("supports full keyboard navigation in the language menu", async () => {
    renderApp();

    const trigger = screen.getByRole("button", {
      name: "Choose language. Current language: English",
    });

    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    const indonesianOption = screen.getByRole("menuitemradio", {
      name: "Switch language to Indonesian",
    });
    const englishOption = screen.getByRole("menuitemradio", {
      name: "Switch language to English",
    });

    await waitFor(() => expect(englishOption).toHaveFocus());

    fireEvent.keyDown(englishOption, { key: "ArrowDown" });
    expect(indonesianOption).toHaveFocus();

    fireEvent.keyDown(indonesianOption, { key: "End" });
    expect(englishOption).toHaveFocus();

    fireEvent.keyDown(englishOption, { key: "Home" });
    expect(indonesianOption).toHaveFocus();

    fireEvent.keyDown(indonesianOption, { key: "Escape" });

    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("exposes a collapsible navigation menu for mobile", () => {
    mockMediaPreferences({ desktopViewport: false });
    renderApp();

    const toggle = screen.getByTestId("mobile-navigation-toggle");

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAccessibleName("Open navigation menu");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName("Close navigation menu");

    fireEvent.keyDown(window, { key: "Escape" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("uses centered top navigation and compact language on iPad Mini", () => {
    mockMediaPreferences({
      desktopViewport: true,
      tabletHeaderViewport: true,
    });
    renderApp();

    expect(
      screen.queryByTestId("mobile-navigation-toggle"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByLabelText("Social profiles")).toHaveClass(
      "tablet-social-rail",
    );
    expect(
      screen.getByRole("button", { name: "Open Guestbook preview" }),
    ).toBeInTheDocument();

    const languageTrigger = screen.getByRole("button", {
      name: "Choose language. Current language: English",
    });
    expect(languageTrigger).toHaveTextContent("EN");
    expect(languageTrigger).not.toHaveTextContent("ID");

    fireEvent.click(languageTrigger);
    fireEvent.click(
      screen.getByRole("menuitemradio", {
        name: "Switch language to Indonesian",
      }),
    );

    expect(
      screen.getByRole("button", {
        name: "Pilih bahasa. Bahasa saat ini: Indonesia",
      }),
    ).toHaveTextContent("ID");
  });

  it("keeps navigation available across arbitrary responsive widths", () => {
    const widths = [
      320, 360, 375, 390, 430, 480, 540, 568, 600, 639, 639.5, 640, 667, 700,
      720, 768, 820, 844, 900, 912, 932, 960, 980, 1024, 1180, 1280, 1366, 1440,
      1536, 1920,
    ];

    for (const width of widths) {
      mockViewport(width, 900);
      const view = renderApp();

      if (width < 640) {
        expect(
          screen.getByTestId("mobile-navigation-toggle"),
        ).toBeInTheDocument();
      } else {
        expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
        expect(
          screen.getByRole("link", { name: "Projects" }),
        ).toBeInTheDocument();
        expect(
          screen.queryByTestId("mobile-navigation-toggle"),
        ).not.toBeInTheDocument();
      }

      view.unmount();
    }
  }, 15000);

  it("keeps fractional widths below 640px in the mobile layout", () => {
    mockViewport(639.5, 1222);
    renderApp();

    expect(screen.getByTestId("mobile-navigation-toggle")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Choose language. Current language: English",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Guestbook" }),
    ).not.toBeInTheDocument();
  });

  it("uses compact navigation only when short landscape lacks space", () => {
    const viewports = [
      [667, 375],
      [844, 390],
      [932, 430],
      [1024, 768],
      [1180, 820],
      [1366, 1024],
    ] as const;

    for (const [width, height] of viewports) {
      mockViewport(width, height);
      const view = renderApp();
      const usesCompactNav = width <= 1023 && height <= 500;

      if (usesCompactNav) {
        expect(
          screen.getByTestId("mobile-navigation-toggle"),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("link", { name: "About" }),
        ).not.toBeInTheDocument();
      } else {
        expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
        expect(
          screen.getByRole("link", { name: "Projects" }),
        ).toBeInTheDocument();
        expect(
          screen.queryByTestId("mobile-navigation-toggle"),
        ).not.toBeInTheDocument();
      }

      view.unmount();
    }
  });

  it("uses the portrait-style menu for phone landscape viewports", () => {
    mockMediaPreferences({
      desktopViewport: true,
      mobileLandscapeViewport: true,
      mobilePhoneLandscapeViewport: true,
    });
    renderApp();

    expect(
      screen.queryByRole("button", { name: "Open Guestbook preview" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Social profiles")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("mobile-navigation-toggle"));

    const drawer = document.getElementById(
      screen
        .getByTestId("mobile-navigation-toggle")
        .getAttribute("aria-controls") ?? "",
    );

    expect(screen.getByRole("link", { name: "Guestbook" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skills" })).toHaveAttribute(
      "href",
      "/#skills",
    );
    expect(screen.getByRole("link", { name: "Skills" })).toHaveClass(
      "hero-mobile-menu-item",
    );
    expect(screen.getByRole("link", { name: "Skills" })).not.toHaveClass(
      "hero-mobile-menu-subitem",
    );
    expect(screen.getByRole("link", { name: "Experience" })).toHaveAttribute(
      "href",
      "/#experience",
    );
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.queryByLabelText("Social profiles")).not.toBeInTheDocument();
    expect(drawer).toHaveAttribute("data-mobile-landscape-layout", "true");
    expect(drawer).toHaveClass("hero-mobile-menu");
    expect(drawer).toHaveClass("bg-surface");
  });

  it("hides the floating top controls while scrolling down in mobile portrait and restores them while scrolling up", () => {
    mockMediaPreferences({
      desktopViewport: false,
    });
    const intersections = mockIntersectionObservers();
    const { container } = renderApp();
    const header = container.querySelector("header");
    const toggle = screen.getByTestId("mobile-navigation-toggle");
    const sentinel = screen.getByTestId("navbar-scroll-sentinel");

    expect(header).toHaveAttribute("data-mobile-nav-visible", "true");
    expect(header).toHaveAttribute("aria-hidden", "false");
    expect(toggle).toHaveAttribute("data-scrolled", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    act(() => {
      intersections.trigger(sentinel, false);
      Object.defineProperty(window, "scrollY", {
        configurable: true,
        value: 100,
      });
      fireEvent.scroll(window);
    });

    expect(header).toHaveAttribute("data-scrolled", "true");
    expect(toggle).toHaveAttribute("data-scrolled", "true");
    expect(header).toHaveAttribute("data-mobile-nav-visible", "false");
    expect(header).toHaveAttribute("aria-hidden", "true");
    expect(header).toHaveAttribute("inert");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    act(() => {
      Object.defineProperty(window, "scrollY", {
        configurable: true,
        value: 80,
      });
      fireEvent.scroll(window);
    });

    expect(header).toHaveAttribute("data-mobile-nav-visible", "true");
    expect(header).toHaveAttribute("data-scrolled", "true");
    expect(header).toHaveAttribute("aria-hidden", "false");
    expect(header).not.toHaveAttribute("inert");

    act(() => {
      Object.defineProperty(window, "scrollY", {
        configurable: true,
        value: 0,
      });
      fireEvent.scroll(window);
    });

    expect(header).toHaveAttribute("data-mobile-nav-visible", "true");
  });

  it("keeps the mobile portrait in Hero without the former availability card", () => {
    mockMediaPreferences({ desktopViewport: false });
    renderApp();
    const portraitShell = screen
      .getByTestId("portrait-parallax")
      .closest(".hero-portrait-shell");

    expect(portraitShell?.nextElementSibling).toBeNull();
    expect(screen.getByTestId("portrait-bottom-mask")).toHaveClass(
      "hero-portrait-mask",
    );
    expect(screen.queryByLabelText("Social profiles")).not.toBeInTheDocument();
    expect(document.querySelector(".hero-portrait-image-fade")).toBeNull();
  });

  it("keeps tablet social links in a dedicated rail with readable CTAs", () => {
    mockMediaPreferences({ desktopViewport: true });
    renderApp();

    expect(screen.getByLabelText("Social profiles")).toHaveClass(
      "tablet-social-rail",
    );
    expect(
      screen.getByRole("link", { name: "VIEW MY WORK" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "VIEW CV" })).toBeInTheDocument();
  });

  it("keeps the social sidebar available while coordinating the navbar scroll state", () => {
    const intersections = mockIntersectionObservers();
    const { container } = renderApp();
    const sentinel = screen.getByTestId("navbar-scroll-sentinel");
    const logoFrame = screen.getByTestId("navbar-logo-frame");
    const blurStrip = screen.getByTestId("navbar-blur-strip");
    const header = container.querySelector("header");
    const navigation = screen.getByRole("navigation");
    const language = screen.getByRole("button", {
      name: "Choose language. Current language: English",
    });
    const theme = screen.getByRole("button", {
      name: "Switch to dark theme",
    });
    const sidebar = screen.getByLabelText("Social profiles");
    const github = container.querySelector('[data-platform="github"]');
    const x = container.querySelector('[data-platform="x"]');

    expect(github).not.toBeNull();
    expect(x).not.toBeNull();
    expect(header).toHaveAttribute("data-scrolled", "false");
    expect(logoFrame).not.toHaveAttribute("data-scrolled");
    expect(blurStrip).toHaveAttribute("data-scroll-linked", "true");
    expect(blurStrip).not.toHaveAttribute("data-active");
    expect(navigation).toHaveAttribute("data-scrolled", "false");
    expect(language).toHaveAttribute("data-scrolled", "false");
    expect(theme).toHaveAttribute("data-scrolled", "false");
    expect(
      screen.queryByTestId("navbar-scroll-surface"),
    ).not.toBeInTheDocument();
    expect(sidebar).not.toHaveAttribute("aria-hidden");
    expect(github).not.toHaveAttribute("tabindex", "-1");
    expect(x).not.toHaveAttribute("tabindex", "-1");
    expect(screen.queryByText("Scroll")).not.toBeInTheDocument();

    act(() => intersections.trigger(sentinel, false));

    expect(header).toHaveAttribute("data-scrolled", "true");
    expect(logoFrame).not.toHaveAttribute("data-scrolled");
    expect(blurStrip).toHaveAttribute("data-scroll-linked", "true");
    expect(blurStrip).not.toHaveAttribute("data-active");
    expect(navigation).toHaveAttribute("data-scrolled", "true");
    expect(language).toHaveAttribute("data-scrolled", "true");
    expect(theme).toHaveAttribute("data-scrolled", "true");

    expect(sidebar).not.toHaveClass("pointer-events-none");
    expect(github).not.toHaveAttribute("tabindex", "-1");
    act(() => intersections.trigger(sentinel, true));

    expect(sidebar).not.toHaveAttribute("aria-hidden");
    expect(header).toHaveAttribute("data-scrolled", "false");
    expect(logoFrame).not.toHaveAttribute("data-scrolled");
    expect(blurStrip).toHaveAttribute("data-scroll-linked", "true");
    expect(blurStrip).not.toHaveAttribute("data-active");
    expect(navigation).toHaveAttribute("data-scrolled", "false");
    expect(language).toHaveAttribute("data-scrolled", "false");
    expect(theme).toHaveAttribute("data-scrolled", "false");
  });

  it("provides the correct tooltip for every social platform", () => {
    renderApp();

    const socialPlatforms = [
      ["github", "GitHub"],
      ["x", "X"],
      ["instagram", "Instagram"],
      ["email", "Email"],
    ] as const;

    for (const [platform, tooltipText] of socialPlatforms) {
      const socialLink = document.querySelector(
        `[data-platform="${platform}"]`,
      );
      const tooltipId = socialLink?.getAttribute("aria-describedby");

      expect(socialLink).not.toBeNull();
      expect(tooltipId).not.toBeNull();
      expect(document.getElementById(tooltipId ?? "")).toHaveTextContent(
        tooltipText,
      );
    }
  });

  it("has no automatically detectable accessibility violations", async () => {
    const { container } = renderApp();
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });

    expect(results.violations).toHaveLength(0);
  });

  it("restores a saved language", () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "id");

    renderApp();

    expect(document.documentElement).toHaveAttribute("lang", "id");
    expect(screen.getByText("Tentang")).toBeInTheDocument();
  });
});
