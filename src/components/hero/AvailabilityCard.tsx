import { Globe2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useLanguage } from "../../hooks/useLanguage";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { entranceTimings, getEntranceMotion } from "../../motion/constants";
import { RotatingStatusText } from "./RotatingStatusText";
import { TranslatedText } from "./TranslatedText";

export function AvailabilityCard() {
  const { copy } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const cardRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const card = cardRef.current;

    if (!card || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? true),
      { threshold: 0.1 },
    );

    observer.observe(card);

    return () => observer.disconnect();
  }, []);

  return (
    <aside
      ref={cardRef}
      aria-label={copy.a11y.availability}
      className="availability-glass-card relative z-30 -mt-8 mb-8 w-[min(92vw,22rem)] justify-self-center overflow-hidden rounded-[0.875rem] border px-3 py-2.5 text-xs text-text-secondary max-[279px]:px-2.5 min-[320px]:-mt-10 min-[320px]:px-4 min-[320px]:py-3 min-[320px]:text-sm sm:col-start-2 sm:row-start-1 sm:mt-0 sm:mb-[8%] sm:w-full sm:max-w-[22rem] sm:self-end sm:justify-self-end sm:px-5 sm:py-4 lg:absolute lg:top-[34.25%] lg:right-[1.8vw] lg:m-0 lg:w-[12rem] lg:max-w-none lg:px-5 lg:py-5"
    >
      <motion.div
        className="availability-card-content relative z-10 flex items-center gap-3 max-[279px]:gap-1.5 lg:block"
        {...getEntranceMotion(
          entranceTimings.availability,
          prefersReducedMotion,
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="hidden text-[0.6875rem] font-semibold tracking-[0.12em] text-text-secondary uppercase sm:block">
            <TranslatedText inline>
              {copy.availability.statusLabel}
            </TranslatedText>
          </p>
          <p className="flex items-center gap-2.5 font-semibold text-text-primary max-[279px]:gap-1.5 sm:mt-1.5 sm:min-h-10 lg:min-h-0">
            <span
              aria-hidden="true"
              className="availability-status-dot size-2.5 shrink-0 rounded-full max-[279px]:size-2"
            />
            <RotatingStatusText
              isActive={isVisible}
              messages={copy.availability.messages}
            />
          </p>
        </div>

        <div
          aria-hidden="true"
          className="h-8 w-px shrink-0 bg-[color-mix(in_srgb,var(--color-text-primary)_12%,transparent)] lg:my-4 lg:h-px lg:w-full"
        />

        <div className="min-w-0 flex-1">
          <p className="hidden text-[0.6875rem] font-semibold tracking-[0.12em] text-text-secondary uppercase sm:block">
            <TranslatedText inline>
              {copy.availability.locationLabel}
            </TranslatedText>
          </p>
          <p className="flex items-center gap-2.5 font-semibold text-text-primary max-[279px]:gap-1.5 sm:mt-1.5 sm:min-h-10 lg:min-h-0">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-accent-500)_15%,transparent)] text-accent-500 max-[279px]:size-6">
              <Globe2 aria-hidden="true" size={17} strokeWidth={1.6} />
            </span>
            <TranslatedText inline>{copy.availability.location}</TranslatedText>
          </p>
        </div>
      </motion.div>
    </aside>
  );
}
