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
      className="relative isolate flex min-h-[70svh] items-center bg-transparent px-5 py-16 text-center text-text-primary sm:px-12 sm:py-20 lg:px-[11.75vw] lg:py-24"
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
          className="mt-6 max-w-[10ch] font-display text-[clamp(3.25rem,15vw,6rem)] leading-[0.82] font-bold tracking-[-0.065em] uppercase sm:mt-8 sm:text-[clamp(5rem,12vw,9rem)] lg:text-[clamp(7rem,10vw,10.5rem)]"
        >
          {workWithMeCopy.heading}
        </h2>

        <p className="mt-8 max-w-[46rem] text-base leading-relaxed text-text-secondary sm:mt-10 sm:text-xl sm:leading-relaxed">
          {workWithMeCopy.description}
        </p>

        <div className="mt-8 flex w-full max-w-[31rem] flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
          <span
            role="link"
            aria-disabled="true"
            className="hero-cta hero-cta-primary flex min-h-16 flex-1 cursor-not-allowed items-center justify-center border border-accent-500 px-6 text-xs font-bold tracking-[0.14em] text-accent-ink uppercase"
          >
            <span className="relative z-10">{workWithMeCopy.getInTouch}</span>
          </span>
          <a
            href="mailto:evindoamandariza@gmail.com"
            className="hero-cta hero-cta-secondary flex min-h-16 flex-1 items-center justify-center border-[1.5px] px-6 text-xs font-bold tracking-[0.14em] text-text-primary uppercase"
          >
            {workWithMeCopy.emailDirectly}
          </a>
        </div>
      </motion.div>
    </section>
  );
}
