import { useEffect, useRef, useState } from "react";

import { HeroContent } from "./HeroContent";
import { HeroHeader } from "./HeroHeader";
import { HeroPortrait } from "./HeroPortrait";

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const navbarSentinelRef = useRef<HTMLSpanElement>(null);
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);

  useEffect(() => {
    const navbarSentinel = navbarSentinelRef.current;

    if (!navbarSentinel || !("IntersectionObserver" in window)) {
      return;
    }

    const navbarObserver = new IntersectionObserver(
      ([entry]) => setIsNavbarScrolled(!(entry?.isIntersecting ?? true)),
      { threshold: 0.01 },
    );

    navbarObserver.observe(navbarSentinel);

    return () => {
      navbarObserver.disconnect();
    };
  }, []);

  return (
    <>
      <HeroHeader isScrolled={isNavbarScrolled} />
      <section
        ref={heroRef}
        id="home"
        aria-labelledby="hero-heading"
        className="relative isolate min-h-svh overflow-hidden bg-transparent text-text-primary"
      >
        <span
          ref={navbarSentinelRef}
          aria-hidden="true"
          data-testid="navbar-scroll-sentinel"
          className="pointer-events-none absolute top-1 left-0 size-px"
        />
        <div className="hero-layout relative z-10 grid grid-cols-1 px-3 pt-24 min-[320px]:px-5 sm:min-h-svh sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-6 sm:pt-15 sm:pr-12 sm:pb-0 sm:pl-16 lg:contents">
          <HeroContent />
          <HeroPortrait parallaxTargetRef={heroRef} />
        </div>
      </section>
    </>
  );
}
