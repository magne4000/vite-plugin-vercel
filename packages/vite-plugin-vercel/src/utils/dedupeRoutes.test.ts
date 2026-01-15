import { store } from "@universal-deploy/store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dedupeRoutes, type RouteIR, sortRoutes } from "./dedupeRoutes";

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

describe("sortRoutes", () => {
  describe("basic static routes", () => {
    it("should sort static routes alphabetically", () => {
      const routes: RouteIR[] = [
        { pathname: [{ value: "users", optional: false }] },
        { pathname: [{ value: "posts", optional: false }] },
        { pathname: [{ value: "admin", optional: false }] },
      ];

      const sorted = sortRoutes(routes);

      expect(sorted[0].pathname[0].value).toBe("admin");
      expect(sorted[1].pathname[0].value).toBe("posts");
      expect(sorted[2].pathname[0].value).toBe("users");
    });

    it("should prioritize longer static routes", () => {
      const routes: RouteIR[] = [
        { pathname: [{ value: "api", optional: false }] },
        {
          pathname: [
            { value: "api", optional: false },
            { value: "v2", optional: false },
          ],
        },
        {
          pathname: [
            { value: "api", optional: false },
            { value: "v1", optional: false },
          ],
        },
      ];

      const sorted = sortRoutes(routes);

      expect(sorted[0].pathname.length).toBe(2);
      expect(sorted[0].pathname[1].value).toBe("v1");
      expect(sorted[1].pathname.length).toBe(2);
      expect(sorted[1].pathname[1].value).toBe("v2");
      expect(sorted[2].pathname.length).toBe(1);
    });
  });

  describe("optional parameters", () => {
    it("should prioritize required segments over optional ones", () => {
      const routes: RouteIR[] = [
        { pathname: [{ value: "api", optional: true }] },
        { pathname: [{ value: "api", optional: false }] },
      ];

      const sorted = sortRoutes(routes);

      expect(sorted[0].pathname[0].optional).toBe(false);
      expect(sorted[1].pathname[0].optional).toBe(true);
    });

    it("should handle mixed optional and required static segments", () => {
      const routes: RouteIR[] = [
        {
          pathname: [
            { value: "users", optional: false },
            { value: "list", optional: true },
          ],
        },
        {
          pathname: [
            { value: "users", optional: false },
            { value: "list", optional: false },
          ],
        },
      ];

      const sorted = sortRoutes(routes);

      expect(sorted[0].pathname[1].optional).toBe(false);
      expect(sorted[1].pathname[1].optional).toBe(true);
    });
  });

  describe("catch-all routes", () => {
    it("should prioritize static routes over catch-all routes", () => {
      const routes: RouteIR[] = [
        { pathname: [{ optional: false, catchAll: { greedy: true } }] },
        { pathname: [{ value: "api", optional: false }] },
      ];

      const sorted = sortRoutes(routes);

      expect(sorted[0].pathname[0].value).toBe("api");
      expect(sorted[1].pathname[0].catchAll).toBeDefined();
    });

    it("should prioritize non-greedy catch-all over greedy", () => {
      const routes: RouteIR[] = [
        { pathname: [{ optional: false, catchAll: { greedy: true } }] },
        { pathname: [{ optional: false, catchAll: { greedy: false } }] },
      ];

      const sorted = sortRoutes(routes);

      expect(sorted[0].pathname[0].catchAll?.greedy).toBe(false);
      expect(sorted[1].pathname[0].catchAll?.greedy).toBe(true);
    });

    it("should handle catch-all with static prefix", () => {
      const routes: RouteIR[] = [
        {
          pathname: [
            { value: "files", optional: false },
            { optional: false, catchAll: { greedy: true } },
          ],
        },
        {
          pathname: [
            { value: "files", optional: false },
            { value: "index", optional: false },
          ],
        },
        { pathname: [{ value: "files", optional: false }] },
      ];

      const sorted = sortRoutes(routes);

      expect(sorted[0].pathname.length).toBe(2);
      expect(sorted[0].pathname[1].value).toBe("index");
      expect(sorted[1].pathname.length).toBe(1);
      expect(sorted[2].pathname[1]?.catchAll).toBeDefined();
    });
  });

  describe("complex route combinations", () => {
    it("should correctly sort a realistic route set", () => {
      const routes: RouteIR[] = [
        { pathname: [{ optional: false, catchAll: { greedy: true } }] },
        {
          pathname: [
            { value: "api", optional: false },
            { value: "users", optional: false },
            { value: "create", optional: false },
          ],
        },
        {
          pathname: [
            { value: "api", optional: false },
            { value: "profile", optional: false },
          ],
        },
        {
          pathname: [
            { value: "api", optional: false },
            { value: "users", optional: false },
          ],
        },
        { pathname: [{ value: "api", optional: false }] },
        { pathname: [{ value: "posts", optional: false }] },
      ];

      const sorted = sortRoutes(routes);

      // Most specific first: /api/users/create
      expect(sorted[0].pathname).toEqual([
        { value: "api", optional: false },
        { value: "users", optional: false },
        { value: "create", optional: false },
      ]);

      // Then /api/profile and /api/users (alphabetically)
      expect(sorted[1].pathname.length).toBe(2);
      expect(sorted[1].pathname[1].value).toBe("profile");
      expect(sorted[2].pathname.length).toBe(2);
      expect(sorted[2].pathname[1].value).toBe("users");

      // Then /api and /posts (alphabetically)
      expect(sorted[3].pathname[0].value).toBe("api");
      expect(sorted[4].pathname[0].value).toBe("posts");

      // Catch-all last
      expect(sorted[5].pathname[0].catchAll).toBeDefined();
    });

    it("should handle nested static routes with different depths", () => {
      const routes: RouteIR[] = [
        {
          pathname: [
            { value: "users", optional: false },
            { value: "admin", optional: false },
            { value: "settings", optional: false },
          ],
        },
        {
          pathname: [
            { value: "users", optional: false },
            { value: "profile", optional: false },
            { value: "edit", optional: false },
          ],
        },
        {
          pathname: [
            { value: "users", optional: false },
            { value: "admin", optional: false },
            { value: "dashboard", optional: false },
          ],
        },
      ];

      const sorted = sortRoutes(routes);

      expect(sorted[0].pathname[1].value).toBe("admin");
      expect(sorted[0].pathname[2].value).toBe("dashboard");
      expect(sorted[1].pathname[1].value).toBe("admin");
      expect(sorted[1].pathname[2].value).toBe("settings");
      expect(sorted[2].pathname[1].value).toBe("profile");
    });
  });

  describe("edge cases", () => {
    it("should handle empty route array", () => {
      const routes: RouteIR[] = [];
      const sorted = sortRoutes(routes);
      expect(sorted).toEqual([]);
    });

    it("should handle single route", () => {
      const routes: RouteIR[] = [{ pathname: [{ value: "api", optional: false }] }];
      const sorted = sortRoutes(routes);
      expect(sorted).toEqual(routes);
    });

    it("should handle routes with same segments", () => {
      const routes: RouteIR[] = [
        { pathname: [{ value: "api", optional: false }] },
        { pathname: [{ value: "api", optional: false }] },
      ];
      const sorted = sortRoutes(routes);
      expect(sorted.length).toBe(2);
    });

    it("should handle empty pathname", () => {
      const routes: RouteIR[] = [{ pathname: [] }, { pathname: [{ value: "api", optional: false }] }];
      const sorted = sortRoutes(routes);
      expect(sorted[0].pathname.length).toBe(1);
      expect(sorted[1].pathname.length).toBe(0);
    });
  });

  describe("catch-all with names", () => {
    it("should handle named catch-all routes", () => {
      const routes: RouteIR[] = [
        { pathname: [{ optional: false, catchAll: { name: "path", greedy: true } }] },
        { pathname: [{ optional: false, catchAll: { name: "slug", greedy: false } }] },
        { pathname: [{ value: "static", optional: false }] },
      ];

      const sorted = sortRoutes(routes);

      expect(sorted[0].pathname[0].value).toBe("static");
      expect(sorted[1].pathname[0].catchAll?.name).toBe("slug");
      expect(sorted[1].pathname[0].catchAll?.greedy).toBe(false);
      expect(sorted[2].pathname[0].catchAll?.name).toBe("path");
      expect(sorted[2].pathname[0].catchAll?.greedy).toBe(true);
    });
  });
});
