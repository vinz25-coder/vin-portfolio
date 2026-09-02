import { CustomCursor } from "./components/global/CustomCursor";
import { FloatingChatWidget } from "./components/global/FloatingChatWidget";
import { ScannerBackground } from "./components/global/ScannerBackground";
import { ViewportEdgeBlur } from "./components/global/ViewportEdgeBlur";
<<<<<<< Updated upstream
import { About } from "./components/about/About";
import { Experience } from "./components/experience/Experience";
import { Hero } from "./components/hero/Hero";
import { HeroSidebar } from "./components/hero/HeroSidebar";
import { Skills } from "./components/skills/Skills";
import { WorkWithMe } from "./components/work-with-me/WorkWithMe";
import { socialLinks } from "./data/social-links";
=======
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";
>>>>>>> Stashed changes

function App() {
  return (
    <BrowserRouter>
      <ScannerBackground />
      <ViewportEdgeBlur />
<<<<<<< Updated upstream
      <main className="relative z-10">
        <Hero />
        <About />
        <Skills />
        <Experience />
        <WorkWithMe />
      </main>
      <HeroSidebar socialLinks={socialLinks} />
=======
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
>>>>>>> Stashed changes
      <FloatingChatWidget />
      <CustomCursor />
    </BrowserRouter>
  );
}

export default App;
