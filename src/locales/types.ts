export interface HeroCopy {
  eyebrow: string;
  subtitleLines: readonly string[];
  cta: {
    projects: string;
    contact: string;
  };
  nav: {
    about: string;
    projects: string;
    skills: string;
    experience: string;
    contact: string;
  };
  availability: {
    statusLabel: string;
    messages: readonly string[];
    busy: string;
    unavailable: string;
  };
  chat: {
    openLabel: string;
    closeLabel: string;
    title: string;
    comingSoon: string;
    openMenuLabel: string;
    closeMenuLabel: string;
    guestbook: string;
    guestbookUnavailable: string;
    previewTitle: string;
    previewBody: string;
    replyLabel: string;
    replyPlaceholder: string;
    sendLabel: string;
    loginGoogle: string;
    loginUnavailable: string;
    privacy: string;
  };
  a11y: {
    primaryNavigation: string;
    homeLink: string;
    socialSidebar: string;
    portraitAlt: string;
    languageMenuLabel: string;
    selectEnglish: string;
    selectIndonesian: string;
    openNavigationMenu: string;
    closeNavigationMenu: string;
    switchThemeToLight: string;
    switchThemeToDark: string;
  };
  about: {
    sectionLabel: string;
    heading: {
      before: string;
      accent: string;
      after: string;
    };
    body: readonly string[];
    quote: string;
    meta: readonly {
      label: string;
      value: string;
    }[];
    principlesLabel: string;
    principles: readonly {
      title: string;
      description: string;
    }[];
  };
  skills: {
    sectionLabel: string;
    heading: {
      before: string;
      accent: string;
      after: string;
    };
    note: string;
    tabs: {
      all: string;
      frontend: string;
      backend: string;
      styling: string;
      tools: string;
      ai: string;
    };
    groups: {
      frontend: string;
      backend: string;
      styling: string;
      tools: string;
      ai: string;
    };
    filterLabel: string;
    panelLabel: string;
    viewMore: string;
    showLess: string;
  };
  experience: {
    sectionLabel: string;
    present: string;
    role: string;
    context: string;
    recordTitle: string;
    businessDescription: string;
    meta: string;
    contributions: readonly string[];
  };
  workWithMe: {
    eyebrow: string;
    heading: string;
    description: string;
    getInTouch: string;
    emailDirectly: string;
  };
  contact: {
    eyebrow: string;
    heading: {
      before: string;
      accent: string;
    };
    introduction: string;
    formHeading: string;
    fields: {
      name: string;
      namePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      projectType: string;
      projectPlaceholder: string;
      message: string;
      messagePlaceholder: string;
    };
    projectTypes: {
      webProduct: string;
      dashboard: string;
      frontendImplementation: string;
      other: string;
    };
    submit: string;
    submitting: string;
    success: string;
    error: string;
    validation: {
      name: string;
      email: string;
      projectType: string;
      message: string;
    };
    directHeading: string;
    privacy: string;
    whatsappMessage: string;
  };
  footer: {
    location: string;
  };
}
