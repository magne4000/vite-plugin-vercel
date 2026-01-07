import { store } from "@universal-deploy/store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dedupeRoutes } from "./dedupeRoutes";

// Mocking @universal-deploy/store
vi.mock("@universal-deploy/store", async () => {
  const actual = await vi.importActual<any>("@universal-deploy/store");
  return {
    ...actual,
    store: {
      entries: [],
    },
  };
});

describe("dedupeRoutes", () => {
  beforeEach(() => {
    store.entries = [];
  });

  it("should return empty array if no entries", () => {
    expect(dedupeRoutes()).toEqual([]);
  });

  it("should keep a single entry as is (wrapping pattern in array)", () => {
    const entry = {
      id: "module1",
      pattern: "/a",
    };
    store.entries.push(entry as any);

    const result = dedupeRoutes();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("module1");
    expect(result[0].pattern).toEqual(["/a"]);
  });

  it("should dedupe multiple entries with same id", () => {
    store.entries.push(
      { id: "module1", pattern: "/a" } as any,
      { id: "module1", pattern: "/b" } as any,
      { id: "module2", pattern: "/c" } as any,
    );

    const result = dedupeRoutes();
    expect(result).toHaveLength(2);

    const m1 = result.find((e) => e.id === "module1");
    const m2 = result.find((e) => e.id === "module2");

    expect(m1?.pattern).toEqual(["/a", "/b"]);
    expect(m2?.pattern).toEqual(["/c"]);
  });

  it("should NOT dedupe entries with vercel config", () => {
    store.entries.push(
      { id: "module1", pattern: "/a", vercel: { isr: 60 } } as any,
      { id: "module1", pattern: "/b" } as any,
      { id: "module1", pattern: "/c", vercel: { edge: true } } as any,
    );

    const result = dedupeRoutes();

    expect(result).toHaveLength(3);
    expect(result[0].pattern).toEqual(["/a"]);
    expect(result[0].vercel).toEqual({ isr: 60 });
    expect(result[1].pattern).toEqual(["/b"]);
    expect(result[1].vercel).toBeUndefined();
    expect(result[2].pattern).toEqual(["/c"]);
    expect(result[2].vercel).toEqual({ edge: true });
  });

  it("should NOT merge entries without vercel config into an entry with vercel config", () => {
    store.entries.push(
      { id: "module1", pattern: "/a", vercel: { isr: 60 } } as any,
      { id: "module1", pattern: "/b" } as any,
    );

    const result = dedupeRoutes();
    // Expected: /a stays separate with its config, /b becomes its own entry (or merges with other pure entries)
    expect(result).toHaveLength(2);
    const withConfig = result.find((e) => e.vercel && Object.keys(e.vercel).length > 0);
    const withoutConfig = result.find((e) => !e.vercel || Object.keys(e.vercel).length === 0);

    expect(withConfig?.pattern).toEqual(["/a"]);
    expect(withoutConfig?.pattern).toEqual(["/b"]);
  });

  it("should handle array patterns correctly when deduping", () => {
    store.entries.push(
      { id: "module1", pattern: ["/a", "/b"] } as any,
      { id: "module1", pattern: "/c" } as any,
      { id: "module1", pattern: ["/d"] } as any,
    );

    const result = dedupeRoutes();
    expect(result).toHaveLength(1);
    expect(result[0].pattern).toEqual(["/a", "/b", "/c", "/d"]);
  });
});
