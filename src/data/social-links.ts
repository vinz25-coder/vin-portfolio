export type SocialPlatform = "github" | "linkedin" | "instagram" | "email";

export interface SocialLink {
  platform: SocialPlatform;
  href: string | null;
  label: string;
}

export const socialLinks: SocialLink[] = [
  {
    platform: "github",
    href: "https://github.com/vinz25-coder",
    label: "GitHub — Evindo Amanda",
  },
  {
    platform: "linkedin",
    href: null,
    label: "LinkedIn — unavailable",
  },
  {
    platform: "instagram",
    href: "https://www.instagram.com/evindoamanda_/",
    label: "Instagram — Evindo Amanda",
  },
  {
    platform: "email",
    href: "mailto:evindoamandariza@gmail.com",
    label: "Email Evindo Amanda",
  },
];
