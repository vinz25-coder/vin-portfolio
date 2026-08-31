import type { CSSProperties } from "react";

import type { SkillItem } from "../../data/skills";

interface SkillIndexItemProps {
  item: SkillItem;
  mobileOverflow?: boolean;
}

interface SkillStyle extends CSSProperties {
  "--skill-brand"?: string;
  "--skill-trace"?: string;
}

export function SkillIndexItem({
  item,
  mobileOverflow = false,
}: SkillIndexItemProps) {
  const style: SkillStyle = item.themeAware
    ? { "--skill-trace": "var(--color-text-primary)" }
    : item.brandColor
      ? {
          "--skill-brand": item.brandColor,
          "--skill-trace": item.brandColor,
        }
      : {};

  return (
    <li
      data-skill={item.id}
      data-category={item.category}
      className={`skill-index-item group relative min-h-20 items-center gap-4 overflow-hidden px-3 py-4 ${mobileOverflow ? "skill-mobile-overflow flex" : "flex"}`}
      style={style}
    >
      <span
        aria-hidden="true"
        className={`skill-index-icon relative z-10 flex size-11 shrink-0 items-center justify-center ${item.themeAware ? "text-text-primary" : ""}`}
      >
        {item.assetSrc ? (
          <img src={item.assetSrc} alt="" className="size-8 object-contain" />
        ) : item.icon ? (
          <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
            <path d={item.icon.path} />
          </svg>
        ) : null}
      </span>

      <span className="relative z-10 min-w-0">
        <span className="skill-index-name block font-display text-lg font-semibold tracking-[-0.025em] text-text-primary sm:text-xl">
          {item.label}
        </span>
      </span>
    </li>
  );
}
