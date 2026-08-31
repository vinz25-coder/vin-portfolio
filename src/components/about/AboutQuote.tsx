import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef } from "react";

import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

interface AboutQuoteProps {
  quote: string;
}

interface HighlightedWordProps {
  emphasized: boolean;
  index: number;
  progress: MotionValue<number>;
  total: number;
  word: string;
}

function HighlightedWord({
  emphasized,
  index,
  progress,
  total,
  word,
}: HighlightedWordProps) {
  const start = (index / total) * 0.84;
  const end = Math.min(start + 0.16, 1);
  const opacity = useTransform(progress, [start, end], [0.24, 1]);

  return (
    <motion.span
      data-about-quote-word
      data-about-quote-emphasis={emphasized ? "true" : undefined}
      className={emphasized ? "inline text-accent-500" : "inline"}
      style={{ opacity }}
    >
      {word}
    </motion.span>
  );
}

export function AboutQuote({ quote }: AboutQuoteProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const words = quote.trim().split(/\s+/);
  const { scrollYProgress } = useScroll({
    target: quoteRef,
    offset: ["start 0.85", "end 0.35"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 20,
    mass: 0.35,
  });
  const emphasizedWords = quote.startsWith("Saya")
    ? new Set(["terasa", "hidup."])
    : new Set(["feel", "alive."]);

  if (prefersReducedMotion) {
    return (
      <p
        ref={quoteRef}
        data-testid="about-quote"
        className="about-quote mt-16 max-w-[24ch] text-left font-display text-[1.625rem] leading-[1.2] font-medium tracking-[-0.035em] text-text-primary sm:mt-20"
      >
        {quote}
      </p>
    );
  }

  return (
    <motion.p
      ref={quoteRef}
      data-testid="about-quote"
      data-scroll-highlight="true"
      className="about-quote mt-16 max-w-[24ch] text-left font-display text-[1.625rem] leading-[1.2] font-medium tracking-[-0.035em] text-text-primary sm:mt-20"
    >
      <span className="sr-only">{quote}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <span key={`${word}-${index}`}>
            <HighlightedWord
              emphasized={emphasizedWords.has(word)}
              index={index}
              progress={smoothProgress}
              total={words.length}
              word={word}
            />
            {index < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </motion.p>
  );
}
