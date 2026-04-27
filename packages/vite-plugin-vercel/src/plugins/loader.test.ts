import { addEntry, type Store } from "@universal-deploy/store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ViteVercelConfig } from "../types";
import { getBuildEnvNames } from "../utils/buildEnvs";
import { loaderPlugin } from "./loader";

vi.mock("@vercel/build-utils", () => ({
  getNodeVersion: vi.fn(async () => ({
    major: 20,
    range: "20.x",
    runtime: "nodejs20.x",
    state: "active",
    formattedDate: undefined,
  })),
}));

const storeSymbol = Symbol.for("ud:store");

// Intentionally coupled to @universal-deploy/store 0.x internals because it does not expose a reset API.
// TODO: Replace this with a public reset/clear API once the store package provides one.
function getStore(): Store {
  return (globalThis as any)[storeSymbol];
}

function getBuildFunctionsPlugin(pluginConfig: ViteVercelConfig) {
  const plugin = loaderPlugin(pluginConfig).find(
    (candidate) => candidate.name === "vite-plugin-vercel:build-functions",
  );
  if (!plugin) throw new Error("Expected build functions plugin");
  return plugin;
}

function getBuildEnvName(pluginConfig: ViteVercelConfig, runtime: "edge" | "node") {
  const environmentName = getBuildEnvNames(pluginConfig)[runtime];

  if (!environmentName) {
    throw new Error(`Expected ${runtime} build environment`);
  }

  return environmentName;
}

async function runBuildStart(pluginConfig: ViteVercelConfig, environmentName: string) {
  const emittedFiles: unknown[] = [];
  const plugin = getBuildFunctionsPlugin(pluginConfig);
  const buildEnvNames = getBuildEnvNames(pluginConfig);

  expect([buildEnvNames.node, buildEnvNames.edge]).toContain(environmentName);

  if (typeof plugin.config === "object" && typeof plugin.config.handler === "function") {
    plugin.config.handler.call({} as never, { root: "/project" } as never, {} as never);
  }

  if (typeof plugin.configEnvironment === "object" && typeof plugin.configEnvironment.handler === "function") {
    plugin.configEnvironment.handler.call({} as never, environmentName, {} as never, {} as never);
  }

  if (typeof plugin.buildStart !== "function") {
    throw new Error("Expected buildStart hook");
  }

  await plugin.buildStart.call(
    {
      environment: {
        name: environmentName,
      },
      emitFile(file: unknown) {
        emittedFiles.push(file);
        return "asset-id";
      },
    } as never,
    {} as never,
  );

  return emittedFiles;
}

describe("loaderPlugin", () => {
  beforeEach(() => {
    getStore().entries = [];
  });

  it("does not create public rewrites for queue consumers", async () => {
    const pluginConfig: ViteVercelConfig = {};

    addEntry({
      id: "src/queue.ts",
      route: "/api/queue",
      vercel: {
        experimentalTriggers: [
          {
            type: "queue/v2beta",
            topic: "orders",
            consumer: "orders-consumer",
          },
        ],
      },
    });

    const emittedFiles = await runBuildStart(pluginConfig, getBuildEnvName(pluginConfig, "node"));
    const vcConfig = emittedFiles[0] as { source: string };

    expect(pluginConfig.rewrites).toEqual([]);
    expect(emittedFiles).toHaveLength(1);
    expect(emittedFiles[0]).toMatchObject({
      type: "asset",
    });
    expect(JSON.parse(vcConfig.source).experimentalTriggers).toEqual([
      {
        type: "queue/v2beta",
        topic: "orders",
        consumer: "orders-consumer",
      },
    ]);
  });

  it("rejects queue consumers on edge functions", async () => {
    const pluginConfig: ViteVercelConfig = {};

    addEntry({
      id: "src/queue.ts",
      route: "/api/queue",
      vercel: {
        edge: true,
        experimentalTriggers: [
          {
            type: "queue/v2beta",
            topic: "orders",
            consumer: "orders-consumer",
          },
        ],
      },
    });

    await expect(runBuildStart(pluginConfig, getBuildEnvName(pluginConfig, "edge"))).rejects.toThrow(
      "Vercel queue consumers must be serverless functions, not edge functions.",
    );
  });

  it("rejects edge queue consumers when the edge environment is disabled", async () => {
    const pluginConfig: ViteVercelConfig = {
      viteEnvNames: {
        edge: false,
      },
    };

    addEntry({
      id: "src/queue.ts",
      route: "/api/queue",
      vercel: {
        edge: true,
        experimentalTriggers: [
          {
            type: "queue/v2beta",
            topic: "orders",
            consumer: "orders-consumer",
          },
        ],
      },
    });

    await expect(runBuildStart(pluginConfig, getBuildEnvName(pluginConfig, "node"))).rejects.toThrow(
      "Vercel queue consumers must be serverless functions, not edge functions.",
    );
  });

  it("creates public rewrites when experimental triggers are empty", async () => {
    const pluginConfig: ViteVercelConfig = {};

    addEntry({
      id: "src/api.ts",
      route: "/api",
      vercel: {
        experimentalTriggers: [],
      },
    });

    await runBuildStart(pluginConfig, getBuildEnvName(pluginConfig, "node"));

    expect(pluginConfig.rewrites).toHaveLength(1);
    expect(pluginConfig.rewrites?.[0]).toMatchObject({
      enforce: undefined,
      source: "/api",
    });
  });
});
