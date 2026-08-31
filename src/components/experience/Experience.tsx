import { motion } from "motion/react";

import { experience } from "../../data/experience";
import { useLanguage } from "../../hooks/useLanguage";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { aboutMotion, EASE_OUT_EXPO } from "../../motion/constants";

export function Experience() {
  const { copy } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { experience: experienceCopy } = copy;
  const period = `${experience.startMonth} ${experience.startYear} – ${experienceCopy.present}`;

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="relative isolate bg-transparent px-5 py-20 text-text-primary sm:px-12 sm:py-24 lg:px-[11.75vw] lg:py-28"
    >
      <div className="mx-auto max-w-[104rem]">
        <h2
          id="experience-heading"
          data-testid="experience-section-label"
          className="experience-section-label inline-flex cursor-default text-xs tracking-[0.24em] uppercase sm:text-sm"
        >
          <span className="experience-label-part">
            {experienceCopy.sectionLabel}
          </span>
        </h2>

        <motion.article
          data-testid="experience-record"
          data-experience-id={experience.id}
          className="experience-record relative mt-10 grid min-w-0 grid-cols-[1rem_minmax(0,1fr)] gap-x-5 sm:mt-12 sm:grid-cols-[minmax(8rem,0.42fr)_2rem_minmax(0,1.58fr)] sm:gap-x-7 lg:grid-cols-[minmax(10rem,0.38fr)_2.5rem_minmax(0,1.62fr)] lg:gap-x-9"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: aboutMotion.viewportAmount }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.5,
            ease: EASE_OUT_EXPO,
          }}
        >
          <div className="experience-metadata col-start-2 row-start-1 sm:col-start-1 sm:text-right">
            <p className="experience-period text-sm font-semibold text-accent-500 sm:text-base">
              {period}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {experienceCopy.context}
            </p>
          </div>

          <div
            aria-hidden="true"
            className="experience-rail relative col-start-1 row-span-2 row-start-1 sm:col-start-2"
          >
            <span className="experience-marker absolute top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full border-2 border-bg bg-text-primary" />
            <span className="experience-spine absolute top-4 bottom-0 left-1/2 w-px -translate-x-1/2 bg-border" />
          </div>

          <div className="col-start-2 row-start-2 mt-7 min-w-0 sm:col-start-3 sm:row-start-1 sm:mt-0">
            <h3 className="font-display text-xl leading-tight font-semibold tracking-[-0.025em] sm:text-2xl">
              {experienceCopy.role}
            </h3>
            <p className="mt-2 text-sm font-medium tracking-[0.06em] text-text-secondary uppercase sm:text-base">
              {experienceCopy.recordTitle}
            </p>

            <p className="mt-4 max-w-[65ch] text-[0.9375rem] leading-relaxed text-text-secondary sm:text-base">
              {experienceCopy.businessDescription}
            </p>
            <p className="mt-2 text-sm font-medium text-text-secondary">
              {experienceCopy.meta}
            </p>

            <ul className="mt-7 max-w-[68ch] space-y-4 sm:mt-8">
              {experienceCopy.contributions.map((contribution, index) => (
                <motion.li
                  key={contribution}
                  className="experience-contribution relative pl-5 text-[0.9375rem] leading-relaxed text-text-secondary sm:text-base"
                  initial={{
                    opacity: 0,
                    y: prefersReducedMotion ? 0 : 8,
                  }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{
                    once: true,
                    amount: aboutMotion.viewportAmount,
                  }}
                  transition={{
                    delay: prefersReducedMotion ? 0 : index * 0.06,
                    duration: prefersReducedMotion ? 0 : 0.35,
                    ease: EASE_OUT_EXPO,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-[0.72em] left-0 size-1.5 rounded-full bg-border"
                  />
                  {contribution}
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
