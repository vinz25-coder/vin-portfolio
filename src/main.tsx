import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { runAccessibilityCheck } from "./a11y/runAccessibilityCheck";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);

if (import.meta.env.DEV) {
  window.setTimeout(() => {
    void runAccessibilityCheck(rootElement);
  }, 0);
}
