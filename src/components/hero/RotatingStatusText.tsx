import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { rotatingStatusMotion } from "../../motion/constants";

interface RotatingStatusTextProps {
  isActive?: boolean;
  messages: readonly string[];
}

export function RotatingStatusText({
  isActive = true,
  messages,
}: RotatingStatusTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [messages]);

  useEffect(() => {
    if (!isActive || messages.length < 2) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % messages.length);
    }, rotatingStatusMotion.intervalMs);

    return () => window.clearInterval(intervalId);
  }, [isActive, messages]);

  const activeMessage = messages[activeIndex] ?? messages[0] ?? "";
  const offsetY = prefersReducedMotion ? 0 : rotatingStatusMotion.offsetY;

  return (
    <span
      aria-live="polite"
      aria-atomic="true"
      className="availability-status-text relative inline-grid min-w-0 overflow-hidden sm:min-h-10 sm:items-center lg:min-h-0"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={`${activeIndex}-${activeMessage}`}
          className="col-start-1 row-start-1 block leading-5"
          initial={{ opacity: 0, y: offsetY }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              duration: rotatingStatusMotion.incomingDuration,
              ease: rotatingStatusMotion.ease,
            },
          }}
          exit={{
            opacity: 0,
            y: -offsetY,
            transition: {
              duration: rotatingStatusMotion.outgoingDuration,
              ease: rotatingStatusMotion.ease,
            },
          }}
        >
          {activeMessage}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
