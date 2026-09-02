import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
Object.defineProperty(window, "scrollTo", {
  configurable: true,
  value: vi.fn(),
});
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  configurable: true,
  value: vi.fn(),
});

afterEach(() => {
  cleanup();
});
