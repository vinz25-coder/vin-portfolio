import { useEffect, useState } from "react";

import { Footer } from "../components/footer/Footer";
import { Guestbook } from "../components/guestbook/Guestbook";
import { HeroHeader } from "../components/hero/HeroHeader";
import { HeroSidebar } from "../components/hero/HeroSidebar";
import { socialLinks } from "../data/social-links";
import { useLanguage } from "../hooks/useLanguage";

export function GuestbookPage() {
  const { language } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 8);
  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    document.title =
      language === "id"
        ? "Buku Tamu | Evindo Amanda"
        : "Guestbook | Evindo Amanda";
  }, [language]);
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("guestbook-main")?.focus();
  }, []);
  return (
    <>
      <HeroHeader isScrolled={isScrolled} page="guestbook" />
      <Guestbook />
      <Footer />
      <HeroSidebar socialLinks={socialLinks} />
    </>
  );
}
