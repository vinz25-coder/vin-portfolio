import { motion } from "motion/react";

import {
  skillCategories,
  skills,
  type SkillCategory,
  type SkillFilter,
} from "../../data/skills";
import { EASE_OUT_EXPO } from "../../motion/constants";
import { SkillIndexItem } from "./SkillIndexItem";

interface SkillsIndexProps {
  activeFilter: SkillFilter;
  expanded: boolean;
  groupLabels: Record<SkillCategory, string>;
  indexId: string;
  prefersReducedMotion: boolean;
}

export function SkillsIndex({
  activeFilter,
  expanded,
  groupLabels,
  indexId,
  prefersReducedMotion,
}: SkillsIndexProps) {
  const visibleCategories =
    activeFilter === "all" ? skillCategories : [activeFilter];

  return (
    <motion.div
      key={activeFilter}
      id={indexId}
      data-testid="skills-index"
      data-mobile-expanded={expanded}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -3 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.25,
        ease: EASE_OUT_EXPO,
      }}
      className="space-y-12"
    >
      {visibleCategories.map((category) => {
        const categorySkills = skills.filter(
          (item) => item.category === category,
        );

        return (
          <section key={category} aria-labelledby={`skills-group-${category}`}>
            <div className="mb-4 flex items-baseline">
              <h3
                id={`skills-group-${category}`}
                className="text-xs font-semibold tracking-[0.18em] text-text-secondary uppercase"
              >
                {groupLabels[category]}
              </h3>
            </div>
            <ul className="grid grid-cols-1 border-t border-border sm:grid-cols-2 sm:gap-x-8">
              {categorySkills.map((item, itemIndex) => (
                <SkillIndexItem
                  key={item.id}
                  item={item}
                  mobileOverflow={activeFilter === "all" && itemIndex >= 2}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </motion.div>
  );
}
