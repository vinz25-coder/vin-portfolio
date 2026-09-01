import { motion } from "motion/react";

import { useLanguage } from "../../hooks/useLanguage";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import {
  ctaItemVariants,
  EASE_OUT_EXPO,
  entranceTimings,
  getCtaContainerVariants,
  getDescriptionEntranceMotion,
  getEntranceMotion,
  getHeadingRevealMotion,
} from "../../motion/constants";
import { TranslatedText } from "./TranslatedText";

export function HeroContent() {
  const { copy } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="mobile-hero-content relative z-30 sm:-top-15 sm:col-start-1 sm:row-start-1 sm:mt-[24vh] sm:self-start lg:absolute lg:top-[27.75%] lg:left-[11.75%] lg:mt-0">
      {/* Eyebrow */}
      <motion.p
        className="mt-2 text-xs font-semibold tracking-[0.24em] text-accent-500 uppercase sm:text-sm"
        {...getEntranceMotion(entranceTimings.eyebrow, prefersReducedMotion)}
      >
        <TranslatedText inline>{copy.eyebrow}</TranslatedText>
      </motion.p>

      {/* Heading */}
      <h1
        id="hero-heading"
        className="mt-6 font-display text-[clamp(2.5rem,15vw,4.75rem)] leading-[0.9] font-bold tracking-[-0.055em] text-text-primary min-[320px]:text-[clamp(3rem,15vw,4.75rem)] sm:mt-5 sm:text-[clamp(3.25rem,8vw,5rem)] lg:mt-[var(--hero-eyebrow-heading-gap)] lg:text-[clamp(4.75rem,6.7vw,7rem)] lg:leading-[var(--hero-heading-line-height)]"
      >
        {/* Evindo */}
        <span className="block overflow-hidden">
          <motion.span
            className="hero-name hero-name-primary block"
            {...getHeadingRevealMotion(
              entranceTimings.heading,
              prefersReducedMotion,
            )}
          >
            Evindo
          </motion.span>
        </span>

        {/* Amanda */}
        <span className="block overflow-hidden">
          <motion.span
            className="hero-name hero-name-accent block"
            {...getHeadingRevealMotion(
              entranceTimings.heading,
              prefersReducedMotion,
              0.08,
            )}
          >
            Amanda
            <span
              aria-hidden="true"
              className="ml-3 inline-block size-[0.13em] bg-accent-500"
            />
          </motion.span>
        </span>
      </h1>

      {/* Description */}
      <motion.p
        className="mt-7 max-w-[27rem] text-base leading-[1.7] text-text-secondary sm:mt-4 sm:text-[1.0625rem] lg:mt-[var(--hero-heading-description-gap)] lg:text-[1.125rem] lg:leading-[1.65]"
        {...getDescriptionEntranceMotion(
          entranceTimings.subtitle,
          prefersReducedMotion,
        )}
      >
        <TranslatedText>
          {copy.subtitleLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </TranslatedText>
      </motion.p>

      {/* CTA Container */}
      <motion.div
        className="mobile-hero-ctas mt-7 flex flex-col items-stretch gap-3 min-[320px]:mt-8 min-[320px]:gap-4 sm:mt-5 sm:w-full sm:max-w-[22rem] sm:flex-row sm:items-center sm:gap-2 md:mt-9 lg:mt-[var(--hero-cta-desktop-margin-top)] lg:w-auto lg:max-w-none lg:gap-[var(--hero-cta-desktop-gap)]"
        initial={prefersReducedMotion ? { opacity: 0 } : "hidden"}
        animate={prefersReducedMotion ? { opacity: 1 } : "visible"}
        variants={
          prefersReducedMotion
            ? undefined
            : getCtaContainerVariants(entranceTimings.ctas)
        }
        transition={
          prefersReducedMotion
            ? {
                delay: entranceTimings.ctas.delay,
                duration: 0.25,
                ease: EASE_OUT_EXPO,
              }
            : undefined
        }
      >
        {/* Primary CTA */}
        <motion.span
          variants={prefersReducedMotion ? undefined : ctaItemVariants}
          role="link"
          aria-disabled="true"
          tabIndex={0}
          className="hero-cta hero-cta-primary flex h-14 w-full cursor-not-allowed items-center justify-center border border-accent-500 px-4 text-xs font-bold tracking-[0.14em] whitespace-nowrap text-accent-ink uppercase min-[320px]:h-16 min-[320px]:px-5 sm:h-14 sm:min-w-0 sm:flex-[1.15] sm:px-3 lg:h-[var(--hero-cta-desktop-height)] lg:w-[var(--hero-cta-desktop-width)] lg:flex-none lg:px-5"
        >
          <span className="relative z-10">
            <TranslatedText inline>{copy.cta.projects}</TranslatedText>
          </span>
        </motion.span>

        {/* Secondary CTA */}
        <motion.span
          variants={prefersReducedMotion ? undefined : ctaItemVariants}
          role="link"
          aria-disabled="true"
          tabIndex={0}
          className="hero-cta hero-cta-secondary flex h-14 w-full cursor-not-allowed items-center justify-center border-[1.5px] px-4 text-xs font-bold tracking-[0.14em] whitespace-nowrap text-text-primary uppercase min-[320px]:h-16 min-[320px]:px-5 sm:h-14 sm:min-w-0 sm:flex-[0.85] sm:px-3 lg:h-[var(--hero-cta-desktop-height)] lg:w-[var(--hero-cta-secondary-width)] lg:flex-none lg:px-5"
        >
          <span>
            <TranslatedText inline>{copy.cta.contact}</TranslatedText>
          </span>
        </motion.span>
      </motion.div>
    </div>
  );
}
