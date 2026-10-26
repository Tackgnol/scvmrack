import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, vi } from "vitest";

// API clients capture the base URL at import time, before beforeAll hooks run.
vi.stubEnv("VITE_BACKEND_URL", "http://localhost:3000");

afterAll(() => {
  vi.unstubAllEnvs();
});

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number =>
    window.setTimeout(() => callback(performance.now()), 16);
}

if (!globalThis.cancelAnimationFrame) {
  globalThis.cancelAnimationFrame = (id: number) => {
    window.clearTimeout(id);
  };
}

// RTL expects this in modern React tests to avoid act warnings.
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  value: true,
  writable: true,
});

afterEach(() => {
  cleanup();
});
