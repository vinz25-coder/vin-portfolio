import type { HeroCopy } from "./types";

export const en = {
  eyebrow: "Front-End Developer",
  subtitleLines: [
    "Front-end specialist, turning design into precise, working code.",
  ],
  cta: {
    projects: "View My Works",
    contact: "View CV",
  },
  nav: {
    about: "About",
    projects: "Projects",
    skills: "Skills",
    experience: "Experience",
    contact: "Contact",
  },
  availability: {
    statusLabel: "Status",
    messages: [
      "Let's collaborate",
      "Open for work",
      "Open for opportunities",
      "Open for freelance",
    ],
    busy: "Currently busy",
    unavailable: "Not available right now",
  },
  chat: {
    openLabel: "Open discussion chat",
    closeLabel: "Close discussion chat",
    title: "Discussion",
    comingSoon: "Coming Soon",
    openMenuLabel: "Open chat menu",
    closeMenuLabel: "Close chat menu",
    guestbook: "Guestbook",
    guestbookUnavailable: "Coming soon",
    previewTitle: "Discussion preview",
    previewBody:
      "Messages and replies will appear here when this feature is available.",
    replyLabel: "Reply",
    replyPlaceholder: "Reply is not available yet",
    sendLabel: "Send reply",
    loginGoogle: "Login with Google",
    loginUnavailable: "Login is not available yet",
    privacy: "Your data is secure and will not be shared with other parties.",
  },
  a11y: {
    primaryNavigation: "Primary navigation",
    homeLink: "Evindo Amanda — Home",
    socialSidebar: "Social profiles",
    portraitAlt: "Portrait of Evindo Amanda wearing a black suit and tie",
    languageMenuLabel: "Choose language. Current language: English",
    selectEnglish: "Switch language to English",
    selectIndonesian: "Switch language to Indonesian",
    openNavigationMenu: "Open navigation menu",
    closeNavigationMenu: "Close navigation menu",
    switchThemeToLight: "Switch to light theme",
    switchThemeToDark: "Switch to dark theme",
  },
  about: {
    sectionLabel: "About Me",
    heading: {
      before: "I turn design into working",
      accent: "code",
      after: ".",
    },
    body: [
      "I am a front-end developer focused on turning design into responsive, accessible, and natural digital experiences.",
      "To me, interface quality is not only about appearance, but also the details of interaction, performance, and how every element works together.",
    ],
    quote:
      "I turn ideas into interfaces. I don't just build screens — I build experiences that respond, move, and feel alive. Because a great product isn't just seen, it's felt.",
    meta: [
      { label: "Focus", value: "Front-End" },
      { label: "Approach", value: "Precise & Accessible" },
      { label: "Based In", value: "North Sumatera, Indonesia" },
    ],
    principlesLabel: "How I work",
    principles: [
      {
        title: "Design to Code",
        description:
          "Translating design into precise, maintainable interfaces.",
      },
      {
        title: "Meaningful Interaction",
        description: "Using motion and feedback to clarify the experience.",
      },
      {
        title: "Performance by Default",
        description:
          "Considering speed, responsiveness, and access from the start.",
      },
    ],
  },
  skills: {
    sectionLabel: "Skills",
    heading: {
      before: "Tools and",
      accent: "technologies",
      after: "I work with.",
    },
    note: "Always learning, always improving.",
    tabs: {
      all: "All",
      frontend: "Frontend",
      backend: "Backend",
      styling: "Styling & Motion",
      tools: "Tools & Workflow",
      ai: "AI Tools",
    },
    groups: {
      frontend: "Frontend",
      backend: "Backend",
      styling: "Styling & Motion",
      tools: "Tools & Workflow",
      ai: "AI Tools",
    },
    filterLabel: "Filter skills by category",
    panelLabel: "Skills technical index",
    viewMore: "View More",
    showLess: "Show Less",
  },
  experience: {
    sectionLabel: "Experience",
    present: "Present",
    role: "Independent Web Developer",
    context: "Internal Business Project",
    recordTitle: "ALAM BARU",
    businessDescription:
      "Custom glass & aluminum fabrication, complemented by ornamental & predator fish retail",
    meta: "Internal Dashboard · North Sumatra, Indonesia",
    contributions: [
      "Designed and developed ALAM BARU, an internal business analytics dashboard that unifies sales, inventory, and customer data across all product lines.",
      "Implemented real-time revenue and profit tracking with trend visualization and category-level performance breakdowns.",
      "Built a reporting workflow that replaced manual spreadsheet-based tracking for daily business operations.",
    ],
  },
  workWithMe: {
    eyebrow: "Let's build something",
    heading: "Work with me",
    description:
      "I'm available for selected projects — web products, dashboards, and product-focused frontend work.",
    getInTouch: "Get in touch",
    emailDirectly: "Email directly",
  },
} satisfies HeroCopy;
