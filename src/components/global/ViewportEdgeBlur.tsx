import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";

export function ViewportEdgeBlur() {
  const { scrollY } = useScroll();
  const [isAtPageEnd, setIsAtPageEnd] = useState(false);
  const topOpacity = useTransform(scrollY, [0, 96], [0, 1]);
  const topBlur = useTransform(scrollY, [0, 96], ["blur(0px)", "blur(7.28px)"]);

  useEffect(() => {
    const updatePageEnd = () => {
      const documentHeight = document.documentElement.scrollHeight;
      setIsAtPageEnd(window.scrollY + window.innerHeight >= documentHeight - 2);
    };

    updatePageEnd();
    window.addEventListener("scroll", updatePageEnd, { passive: true });
    window.addEventListener("resize", updatePageEnd);
    return () => {
      window.removeEventListener("scroll", updatePageEnd);
      window.removeEventListener("resize", updatePageEnd);
    };
  }, []);

  return (
    <>
      <motion.div
        aria-hidden="true"
        data-testid="navbar-blur-strip"
        data-scroll-linked="true"
        data-feathered="true"
        style={{
          opacity: topOpacity,
        }}
        className="viewport-edge-blur viewport-edge-blur-top pointer-events-none fixed inset-x-0 top-0 z-40 bg-transparent"
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backdropFilter: topBlur,
            WebkitBackdropFilter: topBlur,
          }}
        />
      </motion.div>
      <div
        aria-hidden="true"
        data-testid="bottom-blur-strip"
        data-scroll-linked="false"
        data-feathered="true"
        data-at-page-end={isAtPageEnd}
        className="viewport-edge-blur viewport-edge-blur-bottom pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-transparent"
      >
        <div
          aria-hidden="true"
          className="viewport-edge-blur-bottom-layer viewport-edge-blur-bottom-subtle absolute inset-0"
        />
        <div
          aria-hidden="true"
          className="viewport-edge-blur-bottom-layer viewport-edge-blur-bottom-medium absolute inset-0"
        />
        <div
          aria-hidden="true"
          className="viewport-edge-blur-bottom-layer viewport-edge-blur-bottom-strong absolute inset-0"
        />
      </div>
    </>
  );
}
