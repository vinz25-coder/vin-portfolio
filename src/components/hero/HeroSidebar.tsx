import { Github, Instagram, Mail } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useId, useState, type ComponentType } from "react";
import type { SVGProps } from "react";

import type { SocialLink, SocialPlatform } from "../../data/social-links";
import { useLanguage } from "../../hooks/useLanguage";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { mobileViewportQuery } from "../../lib/media-queries";
import {
  entranceTimings,
  getEntranceMotion,
  socialSidebarMotion,
} from "../../motion/constants";
import { BrandXIcon } from "../global/BrandXIcon";

interface HeroSidebarProps {
  socialLinks: SocialLink[];
}

interface SocialIconItemProps {
  link: SocialLink;
}

type SocialIcon = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string }
>;

const socialIcons: Record<SocialPlatform, SocialIcon> = {
  github: Github,
  x: BrandXIcon,
  instagram: Instagram,
  email: Mail,
};

const socialNames: Record<SocialPlatform, string> = {
  github: "GitHub",
  x: "X",
  instagram: "Instagram",
  email: "Email",
};

const iconItemVariants = {
  rest: { scale: 1 },
  hover: { scale: socialSidebarMotion.hoverScale },
  pressed: {
    scale: socialSidebarMotion.pressedScale,
    transition: {
      duration: socialSidebarMotion.pressedDuration,
      ease: socialSidebarMotion.ease,
    },
  },
};

const accentSurfaceVariants = {
  rest: { opacity: 0 },
  hover: { opacity: 1 },
  pressed: { opacity: 1 },
};

const iconColorVariants = {
  rest: { color: "var(--color-text-secondary)" },
  hover: { color: "var(--color-accent-500)" },
  pressed: { color: "var(--color-accent-500)" },
};

const tooltipVariants = {
  rest: {
    opacity: 0,
    x: -socialSidebarMotion.tooltipOffset,
    transition: {
      duration: socialSidebarMotion.pressedDuration,
      ease: socialSidebarMotion.ease,
    },
  },
  hover: {
    opacity: 1,
    x: 0,
    transition: {
      delay: socialSidebarMotion.tooltipDelay,
      duration: socialSidebarMotion.interactionDuration,
      ease: socialSidebarMotion.ease,
    },
  },
  pressed: {
    opacity: 0,
    x: -socialSidebarMotion.tooltipOffset,
  },
};

const iconTransition = {
  duration: socialSidebarMotion.interactionDuration,
  ease: socialSidebarMotion.ease,
};

function SocialIconItem({ link }: SocialIconItemProps) {
  const Icon = socialIcons[link.platform];
  const platformName = socialNames[link.platform];
  const tooltipId = useId();
  const opensNewTab = link.href?.startsWith("http") ?? false;
  const content = (
    <>
      <motion.span
        aria-hidden="true"
        variants={accentSurfaceVariants}
        transition={iconTransition}
        className="absolute inset-0 rounded-[0.75rem] bg-[color-mix(in_srgb,var(--color-accent-500)_15%,transparent)] shadow-[0_0_1.25rem_color-mix(in_srgb,var(--color-accent-500)_24%,transparent)]"
      />
      <motion.span
        aria-hidden="true"
        variants={iconColorVariants}
        transition={iconTransition}
        className="relative z-10 flex items-center justify-center"
      >
        <Icon
          size={link.platform === "x" ? 22 : 25}
          strokeWidth={1.75}
        />
      </motion.span>
      <motion.span
        id={tooltipId}
        role="tooltip"
        variants={tooltipVariants}
        className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 hidden -translate-y-1/2 rounded-[0.75rem] border border-border bg-surface px-3 py-2 text-xs font-medium whitespace-nowrap text-text-primary shadow-[0_0.75rem_1.75rem_color-mix(in_srgb,var(--color-accent-500)_12%,transparent)] sm:block"
      >
        {platformName}
      </motion.span>
    </>
  );
  const sharedMotionProps = {
    initial: "rest",
    animate: "rest",
    whileHover: "hover",
    whileTap: "pressed",
    variants: iconItemVariants,
    transition: iconTransition,
  } as const;
  const sharedClassName =
    "relative flex size-12 shrink-0 items-center justify-center rounded-[0.75rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500 sm:size-11";

  return link.href ? (
    <motion.a
      {...sharedMotionProps}
      href={link.href}
      aria-label={link.label}
      aria-describedby={tooltipId}
      data-platform={link.platform}
      target={opensNewTab ? "_blank" : undefined}
      rel={opensNewTab ? "noopener noreferrer" : undefined}
      whileFocus="hover"
      className={sharedClassName}
    >
      {content}
    </motion.a>
  ) : (
    <motion.span
      {...sharedMotionProps}
      role="link"
      aria-disabled="true"
      aria-label={link.label}
      aria-describedby={tooltipId}
      data-platform={link.platform}
      tabIndex={-1}
      className={`${sharedClassName} cursor-not-allowed opacity-40`}
    >
      {content}
    </motion.span>
  );
}

export function HeroSidebar({ socialLinks }: HeroSidebarProps) {
  const { copy } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window.matchMedia === "function"
      ? window.matchMedia(mobileViewportQuery).matches
      : false,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mobileViewportMedia = window.matchMedia(mobileViewportQuery);
    const updateViewport = () =>
      setIsMobileViewport(mobileViewportMedia.matches);

    updateViewport();
    mobileViewportMedia.addEventListener("change", updateViewport);

    return () =>
      mobileViewportMedia.removeEventListener("change", updateViewport);
  }, []);

  if (isMobileViewport) {
    return null;
  }

  return (
    <motion.aside
      aria-label={copy.a11y.socialSidebar}
      className="tablet-social-rail fixed z-[60] hidden sm:inset-x-auto sm:top-[44%] sm:left-5 sm:block lg:top-[44.6%] lg:left-[3.35vw]"
    >
      <motion.div
        className="flex items-center justify-center sm:flex-col sm:gap-2"
        {...getEntranceMotion(entranceTimings.sidebar, prefersReducedMotion)}
      >
        {socialLinks.map((link) => (
          <SocialIconItem key={link.platform} link={link} />
        ))}
      </motion.div>
    </motion.aside>
  );
}
