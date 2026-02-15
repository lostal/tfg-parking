/**
 * Smoke test — validates the test setup works correctly.
 */

import { describe, it, expect } from "vitest";

describe("Test Setup", () => {
  it("should run a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should support TypeScript generics", () => {
    const identity = <T>(value: T): T => value;
    expect(identity("hello")).toBe("hello");
  });
});
