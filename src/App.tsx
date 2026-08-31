import { CustomCursor } from "./components/global/CustomCursor";
import { FloatingChatWidget } from "./components/global/FloatingChatWidget";
import { ScannerBackground } from "./components/global/ScannerBackground";
import { ViewportEdgeBlur } from "./components/global/ViewportEdgeBlur";
import { About } from "./components/about/About";
import { Experience } from "./components/experience/Experience";
import { Hero } from "./components/hero/Hero";
import { HeroSidebar } from "./components/hero/HeroSidebar";
import { Skills } from "./components/skills/Skills";
import { socialLinks } from "./data/social-links";

function App() {
  return (
    <>
      <ScannerBackground />
      <ViewportEdgeBlur />
      <main className="relative z-10">
        <Hero />
        <About />
        <Skills />
        <Experience />
      </main>
      <HeroSidebar socialLinks={socialLinks} />
      <FloatingChatWidget />
      <CustomCursor />
    </>
  );
}

export default App;
