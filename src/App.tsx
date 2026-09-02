import { CustomCursor } from "./components/global/CustomCursor";
import { FloatingChatWidget } from "./components/global/FloatingChatWidget";
import { ScannerBackground } from "./components/global/ScannerBackground";
import { ViewportEdgeBlur } from "./components/global/ViewportEdgeBlur";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";

function App() {
  return (
    <BrowserRouter>
      <ScannerBackground />
      <ViewportEdgeBlur />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingChatWidget />
      <CustomCursor />
    </BrowserRouter>
  );
}

export default App;
