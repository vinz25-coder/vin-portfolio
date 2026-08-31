import { motion } from "motion/react";

import { useLanguage } from "../../hooks/useLanguage";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { aboutMotion, EASE_OUT_EXPO } from "../../motion/constants";
import { TranslatedText } from "../hero/TranslatedText";
import { AboutPrinciples } from "./AboutPrinciples";
import { AboutQuote } from "./AboutQuote";
import { AboutStatus } from "./AboutStatus";

export function About() {
  const { copy } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { about } = copy;
  const headingText = `${about.heading.before} ${about.heading.accent}${
    about.heading.after.startsWith(".") ? "" : " "
  }${about.heading.after}`;

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative isolate overflow-visible bg-transparent px-5 py-24 text-text-primary sm:px-12 sm:py-32 lg:px-[11.75vw] lg:py-40"
    >
      <div className="mx-auto max-w-[104rem]">
        <motion.p
          data-testid="about-section-label"
          className="about-section-label inline-flex cursor-default text-xs tracking-[0.24em] uppercase sm:text-sm"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: aboutMotion.viewportAmount }}
          transition={{
            duration: aboutMotion.labelTextDuration,
            ease: EASE_OUT_EXPO,
          }}
        >
          <span className="sr-only">{about.sectionLabel}</span>
          <span
            aria-hidden="true"
            data-testid="about-label-title"
            className="about-label-part"
          >
            <TranslatedText inline>{about.sectionLabel}</TranslatedText>
          </span>
        </motion.p>

        <div className="mt-10 grid gap-14 sm:mt-12 sm:gap-16 xl:mt-14 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:gap-[clamp(5rem,8vw,9rem)]">
          <div className="min-w-0">
            <h2
              id="about-heading"
              aria-label={headingText}
              className="max-w-[14ch] font-display text-[clamp(3rem,9vw,6rem)] leading-[0.92] font-bold tracking-[-0.06em] text-balance sm:text-[clamp(4rem,8vw,6rem)] xl:max-w-[13ch] xl:text-[clamp(4rem,5.2vw,6rem)]"
            >
              <span aria-hidden="true" className="about-heading-copy block">
                {about.heading.before}{" "}
                <span
                  data-testid="about-heading-accent"
                  className="text-accent-500 italic"
                >
                  {about.heading.accent}
                </span>
                {about.heading.after.startsWith(".") ? "" : " "}
                {about.heading.after}
              </span>
            </h2>

            <AboutQuote quote={about.quote} />
          </div>

          <div className="about-details min-w-0 xl:pt-3 xl:pl-[clamp(1rem,2vw,2.5rem)]">
            <motion.div
              className="max-w-[42rem] space-y-6 text-base leading-8 text-text-secondary sm:text-lg sm:leading-9"
              initial={{
                opacity: 0,
                y: prefersReducedMotion ? 0 : aboutMotion.offsetY,
              }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: aboutMotion.viewportAmount }}
              transition={{
                duration: aboutMotion.bodyDuration,
                ease: EASE_OUT_EXPO,
              }}
            >
              {about.body.map((paragraph) => (
                <p key={paragraph}>
                  <TranslatedText>{paragraph}</TranslatedText>
                </p>
              ))}
            </motion.div>

            <motion.dl
              data-testid="about-meta-panel"
              className="about-glass-panel mt-12 overflow-hidden rounded-2xl border"
              initial={{
                opacity: 0,
                y: prefersReducedMotion ? 0 : aboutMotion.offsetY,
              }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: aboutMotion.viewportAmount }}
              transition={{
                delay: prefersReducedMotion ? 0 : aboutMotion.stagger,
                duration: aboutMotion.bodyDuration,
                ease: EASE_OUT_EXPO,
              }}
            >
              {about.meta.map((item, index) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[5.75rem_minmax(0,1fr)] items-start gap-2.5 border-b border-border px-3.5 py-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4 sm:px-5"
                >
                  <dt className="text-xs font-semibold tracking-[0.14em] text-text-secondary uppercase">
                    <TranslatedText inline>{item.label}</TranslatedText>
                  </dt>
                  <dd
                    className={`min-w-0 font-display text-base font-semibold text-text-primary ${
                      index === about.meta.length - 1
                        ? "break-normal whitespace-normal sm:whitespace-nowrap"
                        : ""
                    }`}
                  >
                    <span
                      className={
                        index === about.meta.length - 1
                          ? "block whitespace-normal sm:inline-block sm:whitespace-nowrap"
                          : undefined
                      }
                    >
                      <TranslatedText inline>{item.value}</TranslatedText>
                    </span>
                  </dd>
                </div>
              ))}
              <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] items-start gap-2.5 px-3.5 py-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4 sm:px-5">
                <dt className="text-xs font-semibold tracking-[0.14em] text-text-secondary uppercase">
                  <TranslatedText inline>
                    {copy.availability.statusLabel}
                  </TranslatedText>
                </dt>
                <dd className="min-w-0 font-display text-base font-semibold text-text-primary">
                  <AboutStatus />
                </dd>
              </div>
            </motion.dl>

            <AboutPrinciples
              label={about.principlesLabel}
              principles={about.principles}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
