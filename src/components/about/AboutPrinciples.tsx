import { motion } from "motion/react";

import type { HeroCopy } from "../../locales/types";
import { aboutMotion, EASE_OUT_EXPO } from "../../motion/constants";
import { TranslatedText } from "../hero/TranslatedText";

interface AboutPrinciplesProps {
  label: string;
  prefersReducedMotion: boolean;
  principles: HeroCopy["about"]["principles"];
}

export function AboutPrinciples({
  label,
  prefersReducedMotion,
  principles,
}: AboutPrinciplesProps) {
  return (
    <div className="mt-16 lg:mt-20">
      <motion.p
        className="text-xs font-semibold tracking-[0.2em] text-text-secondary uppercase"
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
        <TranslatedText inline>{label}</TranslatedText>
      </motion.p>

      <ol
        data-testid="about-principles-panel"
        className="about-glass-panel mt-5 overflow-hidden rounded-2xl border"
      >
        {principles.map((principle, index) => (
          <motion.li
            key={principle.title}
            className="grid gap-4 border-t border-border px-5 py-7 first:border-t-0 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:items-start sm:gap-6 sm:px-6 lg:py-8"
            initial={{
              opacity: 0,
              y: prefersReducedMotion ? 0 : aboutMotion.offsetY,
            }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: aboutMotion.viewportAmount }}
            transition={{
              delay: prefersReducedMotion ? 0 : index * aboutMotion.stagger,
              duration: aboutMotion.bodyDuration,
              ease: EASE_OUT_EXPO,
            }}
          >
            <span
              data-principle-number
              className="font-display text-sm font-semibold text-accent-500"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-xl font-semibold tracking-[-0.025em] text-text-primary sm:text-2xl">
                <TranslatedText inline>{principle.title}</TranslatedText>
              </h3>
              <p className="mt-3 max-w-[34rem] text-sm leading-7 text-text-secondary sm:text-base">
                <TranslatedText>{principle.description}</TranslatedText>
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
