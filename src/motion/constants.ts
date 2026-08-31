import type { Variants } from "motion/react";

interface EntranceTiming {
  delay: number;
  duration: number;
  offsetY: number;
}

export const EASE_OUT_EXPO: [number, number, number, number] = [
  0.16, 1, 0.3, 1,
];

export const entranceTimings = {
  eyebrow: { delay: 0, duration: 0.5, offsetY: 16 },
  heading: { delay: 0.08, duration: 0.6, offsetY: 16 },
  portrait: { delay: 0.1, duration: 0.8, offsetY: 24 },
  subtitle: { delay: 0.2, duration: 0.5, offsetY: 16 },
  sidebar: { delay: 0.2, duration: 0.5, offsetY: 16 },
  ctas: { delay: 0.28, duration: 0.5, offsetY: 16 },
} satisfies Record<string, EntranceTiming>;

const portraitThemeTransitions = {
  default: { duration: 0.45, ease: "easeInOut" },
  reduced: { duration: 0.2, ease: "easeInOut" },
} as const;

export const languageContentTransition = {
  outgoingDuration: 0.15,
  incomingDuration: 0.2,
  incomingDelay: 0.06,
  layoutDuration: 0.25,
  ease: "easeInOut",
} as const;

export const socialSidebarMotion = {
  hoverScale: 1.15,
  pressedScale: 0.98,
  tooltipOffset: 6,
  tooltipDelay: 0.15,
  interactionDuration: 0.2,
  pressedDuration: 0.15,
  visibilityDuration: 0.2,
  navbarDuration: 0.25,
  ease: EASE_OUT_EXPO,
} as const;

export const navInteractionMotion = {
  pressedScale: 0.98,
  pressedDuration: 0.1,
  ease: EASE_OUT_EXPO,
} as const;

export const rotatingStatusMotion = {
  intervalMs: 3500,
} as const;

export const chatWidgetMotion = {
  hoverScale: 1.02,
  pressedScale: socialSidebarMotion.pressedScale,
  closedScale: socialSidebarMotion.pressedScale,
  interactionDuration: socialSidebarMotion.interactionDuration,
  controlOffset: socialSidebarMotion.tooltipOffset,
  stiffness: 120,
  damping: 14,
  ease: EASE_OUT_EXPO,
} as const;

export const customCursorMotion = {
  hoverScale: socialSidebarMotion.hoverScale,
  lerpFactor: EASE_OUT_EXPO[0],
  hotspotOffset: 4,
} as const;

export const aboutMotion = {
  labelDuration: 0.45,
  labelTextDuration: 0.35,
  labelStagger: 0.06,
  bodyDuration: 0.5,
  dividerDuration: 0.5,
  stagger: 0.08,
  offsetY: 16,
  viewportAmount: 0.2,
} as const;

/**
 * Generic entrance motion.
 *
 * Tetap digunakan oleh:
 * - eyebrow
 * - portrait
 * - sidebar
 * - elemen lain yang hanya memerlukan fade + slide
 */
export function getEntranceMotion(
  timing: EntranceTiming,
  prefersReducedMotion: boolean,
) {
  return {
    initial: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : timing.offsetY,
    },

    animate: {
      opacity: 1,
      y: 0,
    },

    transition: {
      delay: timing.delay,
      duration: timing.duration,
      ease: EASE_OUT_EXPO,
    },
  };
}

/**
 * Heading reveal.
 *
 * Digunakan khusus untuk:
 * Evindo
 * Amanda
 *
 * Parent harus memiliki overflow-hidden agar menghasilkan
 * masked reveal dari bawah.
 */
export function getHeadingRevealMotion(
  timing: EntranceTiming,
  prefersReducedMotion: boolean,
  delayOffset = 0,
) {
  if (prefersReducedMotion) {
    return {
      initial: {
        opacity: 0,
      },

      animate: {
        opacity: 1,
      },

      transition: {
        delay: timing.delay + delayOffset,
        duration: 0.25,
        ease: EASE_OUT_EXPO,
      },
    };
  }

  return {
    initial: {
      opacity: 0,
      y: "110%",
    },

    animate: {
      opacity: 1,
      y: "0%",
    },

    transition: {
      delay: timing.delay + delayOffset,
      duration: timing.duration + 0.15,
      ease: EASE_OUT_EXPO,
    },
  };
}

/**
 * Subtitle / description entrance.
 *
 * Efek:
 * - fade
 * - slide dari bawah
 * - blur ringan
 */
export function getDescriptionEntranceMotion(
  timing: EntranceTiming,
  prefersReducedMotion: boolean,
) {
  if (prefersReducedMotion) {
    return {
      initial: {
        opacity: 0,
      },

      animate: {
        opacity: 1,
      },

      transition: {
        delay: timing.delay,
        duration: 0.25,
        ease: EASE_OUT_EXPO,
      },
    };
  }

  return {
    initial: {
      opacity: 0,
      y: timing.offsetY,
      filter: "blur(4px)",
    },

    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
    },

    transition: {
      delay: timing.delay,
      duration: timing.duration + 0.1,
      ease: EASE_OUT_EXPO,
    },
  };
}

/**
 * Parent variants untuk CTA.
 *
 * delayChildren mengikuti entranceTimings.ctas.delay.
 * Setiap tombol masuk dengan jarak 70ms.
 */
export function getCtaContainerVariants(timing: EntranceTiming): Variants {
  return {
    hidden: {},

    visible: {
      transition: {
        delayChildren: timing.delay,
        staggerChildren: 0.07,
      },
    },
  };
}

/**
 * Individual CTA motion.
 */
export const ctaItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: entranceTimings.ctas.offsetY,
    scale: 0.98,
  },

  visible: {
    opacity: 1,
    y: 0,
    scale: 1,

    transition: {
      duration: entranceTimings.ctas.duration,
      ease: EASE_OUT_EXPO,
    },
  },
};

export function getPortraitThemeTransition(prefersReducedMotion: boolean) {
  return prefersReducedMotion
    ? portraitThemeTransitions.reduced
    : portraitThemeTransitions.default;
}
