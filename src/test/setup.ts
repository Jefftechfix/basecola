import "@testing-library/jest-dom/vitest";

// jsdom has no ResizeObserver; Radix UI controls (checkbox, popover) need one.
if (typeof globalThis.ResizeObserver === "undefined") {
  class StubResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = StubResizeObserver as unknown as typeof ResizeObserver;
}


Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

// jsdom has no scrollIntoView; cmdk scrolls its highlighted item with it.
if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = () => {};
}

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
    dispatchEvent: () => {},
  }),
});
