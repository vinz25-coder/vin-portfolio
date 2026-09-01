import { motion } from "motion/react";

import { useLanguage } from "../../hooks/useLanguage";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { EASE_OUT_EXPO } from "../../motion/constants";

export function WorkWithMe() {
  const { copy } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const workWithMeCopy = copy.workWithMe;

  return (
    <section
      id="work-with-me"
      aria-labelledby="work-with-me-heading"
      className="relative isolate flex min-h-[64svh] items-center bg-transparent px-5 py-14 text-center text-text-primary sm:px-12 sm:py-16 lg:px-[11.75vw] lg:py-20"
    >
      <motion.div
        className="mx-auto flex w-full max-w-[74rem] flex-col items-center"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.6,
          ease: EASE_OUT_EXPO,
        }}
      >
        <p className="work-with-me-section-label inline-flex cursor-default text-[0.6875rem] tracking-[0.32em] uppercase sm:text-xs">
          <span className="work-with-me-label-part">
            {workWithMeCopy.eyebrow}
          </span>
        </p>

        <h2
          id="work-with-me-heading"
          className="work-with-me-heading mt-5 max-w-[10ch] font-display text-[clamp(3rem,13vw,5.5rem)] leading-[0.84] font-bold tracking-[-0.055em] uppercase sm:mt-6 sm:text-[clamp(4.5rem,10.5vw,8rem)] lg:text-[clamp(6.25rem,9vw,9.5rem)]"
        >
          {workWithMeCopy.heading}
        </h2>

        <p className="mt-4 max-w-[46rem] text-base leading-relaxed text-text-secondary sm:mt-5 sm:text-xl sm:leading-relaxed">
          {workWithMeCopy.description}
        </p>

        <div className="mt-7 flex w-full max-w-[31rem] flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:items-stretch sm:justify-center sm:gap-4">
          <span
            role="link"
            aria-disabled="true"
            className="hero-cta hero-cta-primary flex min-h-16 w-fit cursor-not-allowed items-center justify-center border border-accent-500 px-7 text-xs font-bold tracking-[0.14em] whitespace-nowrap text-accent-ink uppercase sm:w-auto sm:flex-1 sm:px-6"
          >
            <span className="relative z-10">{workWithMeCopy.getInTouch}</span>
          </span>
          <a
            href="mailto:evindoamandariza@gmail.com"
            className="hero-cta hero-cta-secondary flex min-h-16 w-fit items-center justify-center border-[1.5px] px-7 text-xs font-bold tracking-[0.14em] whitespace-nowrap text-text-primary uppercase sm:w-auto sm:flex-1 sm:px-6"
          >
            {workWithMeCopy.emailDirectly}
          </a>
        </div>
      </motion.div>
    </section>
  );
}
