import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { useLanguage } from "../../hooks/useLanguage";
import { languageContentTransition } from "../../motion/constants";

interface TranslatedTextProps {
  children: ReactNode;
  inline?: boolean;
}

export function TranslatedText({
  children,
  inline = false,
}: TranslatedTextProps) {
  const { language } = useLanguage();
  const displayClass = inline ? "inline-block" : "block";

  return (
    <motion.span
      layout="size"
      className={`relative ${displayClass}`}
      transition={{
        layout: {
          duration: languageContentTransition.layoutDuration,
          ease: languageContentTransition.ease,
        },
      }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={language}
          className={displayClass}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: {
              delay: languageContentTransition.incomingDelay,
              duration: languageContentTransition.incomingDuration,
              ease: languageContentTransition.ease,
            },
          }}
          exit={{
            opacity: 0,
            transition: {
              duration: languageContentTransition.outgoingDuration,
              ease: languageContentTransition.ease,
            },
          }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
