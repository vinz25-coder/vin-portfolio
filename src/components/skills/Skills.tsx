import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRef, useState } from "react";

import { skillCategories, type SkillFilter } from "../../data/skills";
import { useLanguage } from "../../hooks/useLanguage";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { aboutMotion, EASE_OUT_EXPO } from "../../motion/constants";
import { SkillsFilter } from "./SkillsFilter";
import { SkillsIndex } from "./SkillsIndex";

const filters: readonly SkillFilter[] = ["all", ...skillCategories];

export function Skills() {
  const { copy } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeFilter, setActiveFilter] = useState<SkillFilter>("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const tabRefs = useRef(new Map<SkillFilter, HTMLButtonElement>());
  const { skills: skillsCopy } = copy;
  const headingText = `${skillsCopy.heading.before} ${skillsCopy.heading.accent} ${skillsCopy.heading.after}`;
  const panelId = "skills-panel";
  const indexId = "skills-index-list";
  const changeFilter = (filter: SkillFilter) => {
    setActiveFilter(filter);
    setIsExpanded(false);
  };

  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="relative isolate bg-transparent px-5 py-24 text-text-primary sm:px-12 sm:py-32 lg:px-[11.75vw] lg:py-40"
    >
      <div className="mx-auto max-w-[104rem]">
        <motion.p
          data-testid="skills-section-label"
          className="skills-section-label inline-flex cursor-default text-xs tracking-[0.24em] uppercase sm:text-sm"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: aboutMotion.viewportAmount }}
          transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
        >
          <span className="sr-only">{skillsCopy.sectionLabel}</span>
          <span aria-hidden="true" className="skills-label-part">
            {skillsCopy.sectionLabel}
          </span>
        </motion.p>

        <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] xl:gap-x-[clamp(5rem,8vw,9rem)] xl:gap-y-10">
          <div className="min-w-0 xl:row-span-2">
            <h2
              id="skills-heading"
              aria-label={headingText}
              className="max-w-[13ch] font-display text-[clamp(3rem,7vw,5rem)] leading-[0.96] font-bold tracking-[-0.055em] text-balance"
            >
              <span aria-hidden="true">
                {skillsCopy.heading.before}{" "}
                <span className="text-accent-500">
                  {skillsCopy.heading.accent}
                </span>{" "}
                {skillsCopy.heading.after}
              </span>
            </h2>
            <p className="mt-6 max-w-[30rem] font-display text-base font-medium text-text-secondary italic sm:text-lg">
              {skillsCopy.note}
            </p>
          </div>

          <div className="min-w-0 xl:col-start-2">
            <SkillsFilter
              activeFilter={activeFilter}
              labels={skillsCopy.tabs}
              onChange={changeFilter}
              tabRefs={tabRefs}
              tabs={filters}
              ariaLabel={skillsCopy.filterLabel}
              panelId={panelId}
            />
          </div>

          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={`skills-tab-${activeFilter}`}
            aria-label={skillsCopy.panelLabel}
            className="min-w-0 xl:col-start-2"
          >
            <AnimatePresence initial={false} mode="wait">
              <SkillsIndex
                activeFilter={activeFilter}
                expanded={isExpanded}
                groupLabels={skillsCopy.groups}
                indexId={indexId}
                prefersReducedMotion={prefersReducedMotion}
              />
            </AnimatePresence>
            {activeFilter === "all" ? (
              <button
                type="button"
                aria-controls={indexId}
                aria-expanded={isExpanded}
                className="skills-expand-control mt-8 flex min-h-11 w-full items-center justify-between border-y border-border py-3 font-display text-sm font-semibold text-text-primary sm:hidden"
                onClick={() => setIsExpanded((expanded) => !expanded)}
              >
                {isExpanded ? skillsCopy.showLess : skillsCopy.viewMore}
                {isExpanded ? (
                  <ChevronUp aria-hidden="true" size={18} strokeWidth={1.7} />
                ) : (
                  <ChevronDown aria-hidden="true" size={18} strokeWidth={1.7} />
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
