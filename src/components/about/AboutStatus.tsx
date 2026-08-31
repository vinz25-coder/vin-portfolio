import { useEffect, useRef, useState } from "react";

import {
  availabilityStatus,
  type AvailabilityStatus,
} from "../../data/availability";
import { useLanguage } from "../../hooks/useLanguage";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { rotatingStatusMotion } from "../../motion/constants";

interface AboutStatusProps {
  status?: AvailabilityStatus;
}

export function AboutStatus({ status = availabilityStatus }: AboutStatusProps) {
  const { copy } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const statusRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCharacterCount, setVisibleCharacterCount] = useState(0);
  const messages = copy.availability.messages;

  useEffect(() => {
    const element = statusRef.current;

    if (!element || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? true),
      { threshold: 0.1 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [copy.availability.busy, copy.availability.unavailable, messages, status]);

  useEffect(() => {
    if (status !== "available" || !isVisible || messages.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % messages.length);
    }, rotatingStatusMotion.intervalMs);

    return () => window.clearInterval(intervalId);
  }, [isVisible, messages, status]);

  const activeMessage =
    status === "available"
      ? (messages[activeIndex] ?? messages[0] ?? "")
      : copy.availability[status];

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleCharacterCount(activeMessage.length);
      return;
    }

    setVisibleCharacterCount(0);

    if (!isVisible || activeMessage.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setVisibleCharacterCount((currentCount) => {
        if (currentCount >= activeMessage.length) {
          window.clearInterval(intervalId);
          return currentCount;
        }

        return currentCount + 1;
      });
    }, 32);

    return () => window.clearInterval(intervalId);
  }, [activeMessage, isVisible, prefersReducedMotion]);

  const visibleMessage = activeMessage.slice(0, visibleCharacterCount);

  return (
    <div
      ref={statusRef}
      data-status={status}
      className="about-status flex min-w-0 items-start gap-2.5 whitespace-normal sm:items-center sm:whitespace-nowrap"
    >
      <span
        aria-hidden="true"
        className="about-status-dot mt-[0.4em] size-2 shrink-0 rounded-full sm:mt-0"
      />
      <span className="about-status-text relative inline-grid min-w-0 overflow-visible font-inherit leading-snug text-inherit whitespace-normal sm:whitespace-nowrap">
        <span
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label={activeMessage}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          data-message={activeMessage}
          className="about-status-typing col-start-1 row-start-1 inline-grid whitespace-normal sm:whitespace-nowrap"
        >
          <span className="about-status-typed col-start-1 row-start-1 w-fit">
            {visibleMessage}
          </span>
        </span>
      </span>
    </div>
  );
}
