import { addEntry, type Store } from "@universal-deploy/store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ViteVercelConfig } from "../types";
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

async function runBuildStart(pluginConfig: ViteVercelConfig, environmentName: string) {
  const emittedFiles: unknown[] = [];
  const plugin = getBuildFunctionsPlugin(pluginConfig);

  if (typeof plugin.config === "object" && typeof plugin.config.handler === "function") {
    plugin.config.handler.call({} as never, { root: "/project" } as never, {} as never);
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

    const emittedFiles = await runBuildStart(pluginConfig, "vercel_node");
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

    await expect(runBuildStart(pluginConfig, "vercel_edge")).rejects.toThrow(
      "Vercel queue consumers must be serverless functions, not edge functions.",
    );
  });
});
