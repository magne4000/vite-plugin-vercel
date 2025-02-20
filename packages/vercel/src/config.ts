import { getTransformedRoutes, mergeRoutes, normalizeRoutes, type Route } from "@vercel/routing-utils";
import { type VercelOutputConfig, vercelOutputConfigSchema } from "./schemas/config/config";
import type { ViteVercelConfig, ViteVercelRewrite } from "./types";

function reorderEnforce<T extends { enforce?: "pre" | "post" }>(arr: T[]) {
  return [
    ...arr.filter((r) => r.enforce === "pre"),
    ...arr.filter((r) => !r.enforce),
    ...arr.filter((r) => r.enforce === "post"),
  ];
}

export function getConfig(pluginConfig: ViteVercelConfig): VercelOutputConfig {
  const _rewrites: ViteVercelRewrite[] = [...(pluginConfig.rewrites ?? [])];

  const { routes, error } = getTransformedRoutes({
    cleanUrls: pluginConfig.cleanUrls ?? true,
    trailingSlash: pluginConfig.trailingSlash,
    rewrites: reorderEnforce(_rewrites),
    redirects: pluginConfig.redirects ? reorderEnforce(pluginConfig.redirects) : undefined,
    headers: pluginConfig.headers,
  });

  if (error) {
    throw error;
  }

  if (
    pluginConfig.config?.routes &&
    pluginConfig.config.routes.length > 0 &&
    !pluginConfig.config.routes.every((r) => "continue" in r && r.continue)
  ) {
    console.warn(
      'Did you forget to add `"continue": true` to your routes? See https://vercel.com/docs/build-output-api/v3/configuration#source-route\n' +
        "If not, it is discouraged to use `routes` config to override routes. " +
        "Prefer using `rewrites` and `redirects`.",
    );
  }

  let userRoutes: Route[] = [];
  let buildRoutes: Route[] = [];

  if (pluginConfig.config?.routes) {
    const norm = normalizeRoutes(pluginConfig.config.routes);

    if (norm.error) {
      throw norm.error;
    }

    userRoutes = norm.routes ?? [];
  }

  if (routes) {
    const norm = normalizeRoutes(routes);

    if (norm.error) {
      throw norm.error;
    }

    buildRoutes = norm.routes ?? [];
  }

  const cleanRoutes = mergeRoutes({
    userRoutes,
    builds: [
      {
        use: "@vercel/node",
        entrypoint: "index.js",
        routes: buildRoutes,
      },
    ],
  });

  return vercelOutputConfigSchema.parse({
    version: 3,
    ...pluginConfig.config,
    routes: cleanRoutes,
    overrides: {
      ...pluginConfig.config?.overrides,
    },
  });
}

// export function getConfigDestination(resolvedConfig: ResolvedConfig) {
//   return path.join(getOutput(resolvedConfig), "config.json");
// }

// export async function writeConfig(
//   resolvedConfig: ResolvedConfig,
//   rewrites?: Rewrite[],
//   overrides?: VercelOutputConfig["overrides"],
//   headers?: Header[],
// ): Promise<void> {
//   await fs.writeFile(
//     getConfigDestination(resolvedConfig),
//     // biome-ignore lint/style/noNonNullAssertion: <explanation>
//     JSON.stringify(getConfig(resolvedConfig.vercel!, rewrites, overrides, headers), undefined, 2),
//     "utf-8",
//   );
// }
