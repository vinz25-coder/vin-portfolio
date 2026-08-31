import type { KeyboardEvent, RefObject } from "react";

import type { SkillFilter } from "../../data/skills";

interface SkillsFilterProps {
  activeFilter: SkillFilter;
  labels: Record<SkillFilter, string>;
  onChange: (filter: SkillFilter) => void;
  tabRefs: RefObject<Map<SkillFilter, HTMLButtonElement>>;
  tabs: readonly SkillFilter[];
  ariaLabel: string;
  panelId: string;
}

export function SkillsFilter({
  activeFilter,
  labels,
  onChange,
  tabRefs,
  tabs,
  ariaLabel,
  panelId,
}: SkillsFilterProps) {
  const selectByIndex = (index: number) => {
    const nextFilter = tabs[(index + tabs.length) % tabs.length];

    if (!nextFilter) {
      return;
    }

    onChange(nextFilter);
    tabRefs.current.get(nextFilter)?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    filter: SkillFilter,
  ) => {
    const index = tabs.indexOf(filter);

    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectByIndex(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectByIndex(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectByIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      selectByIndex(tabs.length - 1);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="skills-filter -mx-5 flex gap-6 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {tabs.map((filter) => {
        const isActive = filter === activeFilter;

        return (
          <button
            key={filter}
            ref={(node) => {
              if (node) {
                tabRefs.current.set(filter, node);
              } else {
                tabRefs.current.delete(filter);
              }
            }}
            id={`skills-tab-${filter}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            data-active={isActive}
            className="skills-filter-tab relative min-h-11 shrink-0 rounded-md border-b border-transparent px-3 py-2 text-sm font-semibold whitespace-nowrap text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
            onClick={() => onChange(filter)}
            onKeyDown={(event) => handleKeyDown(event, filter)}
          >
            {labels[filter]}
          </button>
        );
      })}
    </div>
  );
}
