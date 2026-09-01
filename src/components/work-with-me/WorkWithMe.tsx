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
      aria-labelledby="work-with-me-heading"
      className="relative isolate flex min-h-[80svh] items-center bg-transparent px-5 py-24 text-center text-text-primary sm:px-12 sm:py-28 lg:px-[11.75vw] lg:py-32"
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
        <p className="text-[0.6875rem] font-semibold tracking-[0.32em] text-text-secondary uppercase sm:text-xs">
          {workWithMeCopy.eyebrow}
        </p>

        <h2
          id="work-with-me-heading"
          className="mt-8 max-w-[10ch] font-display text-[clamp(3.25rem,15vw,6rem)] leading-[0.82] font-bold tracking-[-0.065em] uppercase sm:mt-10 sm:text-[clamp(5rem,12vw,9rem)] lg:text-[clamp(7rem,10vw,10.5rem)]"
        >
          {workWithMeCopy.heading}
        </h2>

        <p className="mt-10 max-w-[46rem] text-base leading-relaxed text-text-secondary sm:mt-12 sm:text-xl sm:leading-relaxed">
          {workWithMeCopy.description}
        </p>

        <div className="mt-10 flex w-full max-w-[31rem] flex-col gap-3 sm:mt-12 sm:flex-row sm:justify-center sm:gap-4">
          <span
            role="link"
            aria-disabled="true"
            className="work-with-me-primary flex min-h-16 flex-1 cursor-not-allowed items-center justify-center rounded-[1.15rem] border border-accent-500 bg-accent-500 px-6 text-xs font-bold tracking-[0.14em] text-accent-ink uppercase opacity-75"
          >
            {workWithMeCopy.getInTouch}
          </span>
          <a
            href="mailto:evindoamandariza@gmail.com"
            className="work-with-me-secondary flex min-h-16 flex-1 items-center justify-center rounded-[1.15rem] border border-border bg-[color-mix(in_srgb,var(--color-surface)_24%,transparent)] px-6 text-xs font-bold tracking-[0.14em] text-text-primary uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
          >
            {workWithMeCopy.emailDirectly}
          </a>
        </div>
      </motion.div>
    </section>
  );
}
