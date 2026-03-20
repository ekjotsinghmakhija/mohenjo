import { expect, afterEach } from "bun:test";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Bun's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup the DOM after each test to prevent state leakage
afterEach(() => {
  cleanup();
});
