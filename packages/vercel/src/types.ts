import type { Header, Redirect, Rewrite } from "@vercel/routing-utils";
import type { Photon } from "@photonjs/core";
import type { VercelOutputConfig, VercelOutputPrerenderConfig } from "@vite-plugin-vercel/schemas";

export type ViteVercelRewrite = Rewrite & { enforce?: "pre" | "post" };
export type ViteVercelRedirect = Redirect & { enforce?: "pre" | "post" };

export interface ViteVercelConfig {
  /**
   * How long Functions should be allowed to run for every request, in seconds.
   * If left empty, default value for your plan will be used.
   */
  defaultMaxDuration?: number;
  /**
   * Default expiration time (in seconds) for prerender functions.
   * Defaults to 86400 seconds (24h).
   * @see {@link https://vercel.com/docs/concepts/next.js/incremental-static-regeneration}
   * @see {@link https://vercel.com/docs/build-output-api/v3#vercel-primitives/prerender-functions/configuration}
   */
  expiration?: number;
  /**
   * @see {@link https://vercel.com/docs/projects/project-configuration#rewrites}
   */
  rewrites?: ViteVercelRewrite[];
  /**
   * @see {@link https://vercel.com/docs/projects/project-configuration#headers}
   * @beta
   */
  headers?: Header[];
  /**
   * @see {@link https://vercel.com/docs/projects/project-configuration#redirects}
   */
  redirects?: ViteVercelRedirect[];
  /**
   * @see {@link https://vercel.com/docs/projects/project-configuration#cleanurls}
   */
  cleanUrls?: boolean;
  /**
   * @see {@link https://vercel.com/docs/projects/project-configuration#trailingslash}
   */
  trailingSlash?: boolean;
  /**
   * When true, the Serverless Function will stream the response to the client.
   * @see {@link https://vercel.com/docs/build-output-api/v3/primitives#serverless-function-configuration}
   */
  defaultSupportsResponseStreaming?: boolean;
  /**
   * Use `getEntriesFromFs` for mapping your filesystem routes to entries.
   * If you are interfacing this plugin with a framework, entries can also be added through the Photon API
   */
  handlers?: Record<string, Photon.EntryUniversalHandler>;
  /**
   * TODO
   */
  server?: Photon.EntryServer;
  /**
   * Advanced configuration to override .vercel/output/config.json
   * @see {@link https://vercel.com/docs/build-output-api/v3/configuration#configuration}
   * @protected
   */
  config?: Partial<Omit<VercelOutputConfig, "version">>;
  /**
   * Defaults to `.vercel/output`. Mostly useful for testing purpose
   * @protected
   */
  outDir?: string;
}

export interface VercelOutputIsr extends VercelOutputPrerenderConfig {
  symlink?: string;
  route?: string;
}

/**
 * Keys are path relative to .vercel/output/static directory
 */
export type ViteVercelRouteOverrides = VercelOutputConfig["overrides"];

export interface VercelEntryOptions {
  /**
   * Relative to `.vercel/output/functions`, without extension
   */
  destination?: string;
  /**
   * If `true`, guesses route for the function, and adds it to config.json (mimics defaults Vercel behavior).
   * If a string is provided, it will be equivalent to a `rewrites` rule.
   * Set to `false` to disable
   */
  route?: string | boolean;
  /**
   * Ensures that the route is added before or after others
   */
  enforce?: "post" | "pre";
  /**
   * Set to `true` to mark this function as an Edge Function
   */
  edge?: boolean;
  /**
   * Additional headers
   */
  headers?: Record<string, string> | null;
  /**
   * ISR config
   */
  isr?: VercelOutputIsr;
  /**
   * When true, the Serverless Function will stream the response to the client
   */
  streaming?: boolean;
  /**
   * When true, do not build output files for this entry
   */
  disabled?: boolean;
}

declare module "@photonjs/core" {
  export namespace Photon {
    export interface EntryBase {
      vercel?: VercelEntryOptions;
    }
  }
}
