import type { SimpleIcon } from "simple-icons";
import {
  siCss,
  siGit,
  siGithub,
  siHtml5,
  siJavascript,
  siReact,
  siSupabase,
  siTailwindcss,
  siTypescript,
  siVite,
} from "simple-icons";

export const skillCategories = [
  "frontend",
  "backend",
  "styling",
  "tools",
  "ai",
] as const;

export type SkillCategory = (typeof skillCategories)[number];
export type SkillFilter = "all" | SkillCategory;

export interface SkillItem {
  id: string;
  category: SkillCategory;
  label: string;
  icon?: SimpleIcon;
  assetSrc?: string;
  brandColor?: `#${string}`;
  themeAware?: boolean;
}

function fromSimpleIcon(
  id: string,
  category: SkillCategory,
  label: string,
  icon: SimpleIcon,
  themeAware = false,
): SkillItem {
  return {
    id,
    category,
    label,
    icon,
    brandColor: `#${icon.hex}`,
    themeAware,
  };
}

export const skills: readonly SkillItem[] = [
  fromSimpleIcon("react", "frontend", "React", siReact),
  fromSimpleIcon("typescript", "frontend", "TypeScript", siTypescript),
  fromSimpleIcon("javascript", "frontend", "JavaScript", siJavascript),
  fromSimpleIcon("html", "frontend", "HTML", siHtml5),
  fromSimpleIcon("supabase", "backend", "Supabase", siSupabase),
  fromSimpleIcon("css", "styling", "CSS", siCss),
  fromSimpleIcon("tailwind", "styling", "Tailwind CSS", siTailwindcss),
  {
    id: "motion",
    category: "styling",
    label: "Motion",
    assetSrc: "/skills/motion.svg",
    brandColor: "#FFF312",
  },
  {
    id: "react-bits",
    category: "styling",
    label: "React Bits",
    assetSrc: "/skills/react-bits.png",
    themeAware: true,
  },
  fromSimpleIcon("vite", "tools", "Vite", siVite),
  fromSimpleIcon("git", "tools", "Git", siGit),
  fromSimpleIcon("github", "tools", "GitHub", siGithub, true),
  {
    id: "figma",
    category: "tools",
    label: "Figma",
    assetSrc: "/skills/figma.svg",
    themeAware: true,
  },
  {
    id: "chatgpt",
    category: "ai",
    label: "ChatGPT",
    assetSrc: "/skills/chatgpt.png",
    themeAware: true,
  },
  {
    id: "codex",
    category: "ai",
    label: "Codex",
    assetSrc: "/skills/codex.png",
    brandColor: "#635BFF",
  },
  {
    id: "claude",
    category: "ai",
    label: "Claude",
    assetSrc: "/skills/claude.svg",
    brandColor: "#D97757",
  },
  {
    id: "opencode",
    category: "ai",
    label: "OpenCode",
    assetSrc: "/skills/opencode.svg",
    themeAware: true,
  },
  {
    id: "hermes",
    category: "ai",
    label: "Hermes",
    assetSrc: "/skills/hermes.png",
    themeAware: true,
  },
  {
    id: "9router",
    category: "ai",
    label: "9Router",
    assetSrc: "/skills/9router.svg",
    brandColor: "#E56A4A",
  },
];
