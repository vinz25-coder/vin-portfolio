import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { About } from "../components/about/About";
import { Experience } from "../components/experience/Experience";
import { Footer } from "../components/footer/Footer";
import { Hero } from "../components/hero/Hero";
import { HeroSidebar } from "../components/hero/HeroSidebar";
import { Skills } from "../components/skills/Skills";
import { WorkWithMe } from "../components/work-with-me/WorkWithMe";
import { socialLinks } from "../data/social-links";

export function HomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    document.title = "Evindo Amanda | Front-End Developer";
  }, []);

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [hash]);

  return (
    <>
      <main className="relative z-10">
        <Hero />
        <About />
        <Skills />
        <Experience />
        <WorkWithMe />
      </main>
      <Footer />
      <HeroSidebar socialLinks={socialLinks} />
    </>
  );
}
