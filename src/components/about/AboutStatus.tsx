import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  availabilityStatus,
  type AvailabilityStatus,
} from "../../data/availability";
import { useLanguage } from "../../hooks/useLanguage";
import { rotatingStatusMotion } from "../../motion/constants";

interface AboutStatusProps {
  status?: AvailabilityStatus;
}

export function AboutStatus({ status = availabilityStatus }: AboutStatusProps) {
  const { copy } = useLanguage();
  const statusRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
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
  const typingStyle = {
    "--about-status-characters": Math.max(activeMessage.length, 1),
  } as CSSProperties;

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
      <span
        aria-live="polite"
        aria-atomic="true"
        className="about-status-text relative inline-flex min-w-0 overflow-visible font-inherit leading-snug text-inherit whitespace-normal sm:whitespace-nowrap"
      >
        <span
          key={`${activeIndex}-${activeMessage}`}
          style={typingStyle}
          className="about-status-typing relative block whitespace-normal sm:whitespace-nowrap"
        >
          {activeMessage}
        </span>
      </span>
    </div>
  );
}
