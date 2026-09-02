export function scrollToSection(sectionId: string) {
  const section = document.getElementById(sectionId);
  const target = section?.querySelector<HTMLElement>("[data-section-start]") ?? section;

  target?.scrollIntoView({ block: "start" });
}
