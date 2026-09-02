import { useEffect, useState } from "react";

import { Contact } from "../components/contact/Contact";
import { Footer } from "../components/footer/Footer";
import { HeroHeader } from "../components/hero/HeroHeader";
import { HeroSidebar } from "../components/hero/HeroSidebar";
import { socialLinks } from "../data/social-links";
import { useLanguage } from "../hooks/useLanguage";

export function ContactPage() {
  const { language } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 8);

  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 8);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  useEffect(() => {
    document.title =
      language === "id" ? "Kontak | Evindo Amanda" : "Contact | Evindo Amanda";
  }, [language]);

  return (
    <>
      <HeroHeader isScrolled={isScrolled} page="contact" />
      <Contact />
      <Footer />
      <HeroSidebar socialLinks={socialLinks} />
    </>
  );
}
