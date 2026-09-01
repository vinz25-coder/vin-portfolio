import { motion } from "motion/react";
import type { RefObject } from "react";

import { portraitAssets } from "../../data/portrait-assets";
import { useLanguage } from "../../hooks/useLanguage";
import { usePointerParallax } from "../../hooks/usePointerParallax";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useTheme } from "../../hooks/useTheme";
import {
  entranceTimings,
  getEntranceMotion,
  getPortraitThemeTransition,
} from "../../motion/constants";

const portraitSizes =
  "(max-width: 319px) calc(100vw - 24px), (max-width: 639.98px) calc(100vw - 40px), (max-width: 1199.98px) and (orientation: portrait) min(110vw, 1024px), (max-width: 959.98px) 52vw, (min-width: 1719px) 928px, 54vw";
const portraitThemes = ["light", "dark"] as const;

interface HeroPortraitProps {
  parallaxTargetRef: RefObject<HTMLElement | null>;
}

export function HeroPortrait({ parallaxTargetRef }: HeroPortraitProps) {
  const { theme } = useTheme();
  const { copy } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const parallax = usePointerParallax(parallaxTargetRef);
  const portraitThemeTransition =
    getPortraitThemeTransition(prefersReducedMotion);

  return (
    <motion.div
      className="hero-portrait-shell pointer-events-none relative z-10 mx-auto mt-0 w-[min(88vw,22rem)] sm:-top-6 sm:col-start-2 sm:row-start-1 sm:w-full sm:max-w-none sm:self-center lg:absolute lg:top-auto lg:right-[5vw] lg:bottom-auto lg:w-[min(54vw,58rem)]"
      {...getEntranceMotion(entranceTimings.portrait, prefersReducedMotion)}
    >
      <div
        data-testid="portrait-bottom-mask"
        className="hero-portrait-mask h-full w-full"
      >
        <motion.div
          data-testid="portrait-parallax"
          className="h-full w-full"
          style={parallax}
        >
          <div className="hero-portrait-float relative h-full w-full">
            <div
              data-testid="portrait-overscan"
              className="hero-portrait-overscan relative h-full w-full"
            >
              {portraitThemes.map((portraitTheme) => {
                const asset = portraitAssets[portraitTheme];
                const isActive = theme === portraitTheme;

                return (
                  <picture key={portraitTheme} className="contents">
                    {asset.sources.map((source) => (
                      <source
                        key={source.type}
                        type={source.type}
                        srcSet={source.srcSet}
                        sizes={portraitSizes}
                      />
                    ))}
                    <motion.img
                      src={asset.fallbackSrc}
                      width={asset.width}
                      height={asset.height}
                      sizes={portraitSizes}
                      alt={isActive ? copy.a11y.portraitAlt : ""}
                      aria-hidden={!isActive}
                      decoding="async"
                      fetchPriority={isActive ? "high" : "low"}
                      className={
                        portraitTheme === "light"
                          ? "hero-portrait-image block h-auto w-full"
                          : "hero-portrait-image absolute inset-0 block h-auto w-full"
                      }
                      initial={false}
                      animate={{ opacity: isActive ? 1 : 0 }}
                      transition={portraitThemeTransition}
                    />
                  </picture>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
