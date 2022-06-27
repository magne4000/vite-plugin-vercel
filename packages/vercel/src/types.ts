import type { ResolvedConfig } from 'vite';
import type { BuildOptions, StdinOptions } from 'esbuild';
import type { VercelOutputConfig } from './schemas/config/config';
import type { VercelOutputVcConfig } from './schemas/config/vc-config';
import type { VercelOutputPrerenderConfig } from './schemas/config/prerender-config';
import type { VercelConfig } from '@vercel/routing-utils';

export type {
  VercelOutputConfig,
  VercelOutputVcConfig,
  VercelOutputPrerenderConfig,
};

// Vite config for Vercel

export interface ViteVercelConfig {
  /**
   * How long Functions should be allowed to run for every request in seconds.
   * If left empty, default value for your plan will is used.
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
   * Also known as Server Side Generation, or SSG.
   * If present, must build static files in `.vercel/output/static`.
   * Can be set to `false` to disable prerendering completely.
   */
  prerender?: ViteVercelPrerenderFn | false;
  /**
   * By default, all `api/*` endpoints are compiled under `.vercel/output/functions/api/*.func`.
   * If others serverless functions need to be compiled under `.vercel/output/functions`, they should be added here.
   * For instance, a framework can leverage this to have a generic ssr endpoint
   * without requiring the user to write any code.
   *
   * @example
   * ```
   * {
   *   additionalEndpoints: [
   *     {
   *       // can also be an Object representing an esbuild StdinOptions
   *       source: '/path/to/file.ts',
   *       // URL path of the handler, will be generated to `.vercel/output/functions/api/file.func/index.js`
   *       destination: '/api/file',
   *     }
   *   ]
   * }
   * ```
   */
  rewrites?: VercelConfig['rewrites'];
  redirects?: VercelConfig['redirects'];
  cleanUrls?: VercelConfig['cleanUrls'];
  trailingSlash?: VercelConfig['trailingSlash'];
  additionalEndpoints?: ViteVercelApiEntry[];
  /**
   * Advanced configuration to override .vercel/output/config.json
   * @see {@link https://vercel.com/docs/build-output-api/v3#build-output-configuration}
   * @protected
   */
  config?: Partial<Omit<VercelOutputConfig, 'version'>>;
  /**
   * ISR and SSG pages are mutually exclusive. If a page is found in both, ISR prevails.
   * Keys are path relative to .vercel/output/functions directory, either without extension,
   * or with `.prerender-config.json` extension.
   * If you have multiple isr configurations pointing to the same underlying function, you can leverage the `symlink`
   * property. See example below.
   *
   * @example
   * ```
   * // Here `ssr_` means that a function is available under `.vercel/output/functions/ssr_.func`
   * isr: {
   *   '/pages/a': { expiration: 15, symlink: 'ssr_', route: '^/a/.*$' },
   *   '/pages/b/c': { expiration: 15, symlink: 'ssr_', route: '^/b/c/.*$' },
   *   '/pages/d': { expiration: 15, symlink: 'ssr_', route: '^/d$' },
   *   '/pages/e': { expiration: 25 }
   * }
   * ```
   *
   * @protected
   */
  isr?:
    | Record<string, VercelOutputIsr>
    | (() =>
        | Promise<Record<string, VercelOutputIsr>>
        | Record<string, VercelOutputIsr>);
  /**
   * Defaults to `.vercel/output`. Mostly useful for testing prupose
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
export type ViteVercelPrerenderRoute = VercelOutputConfig['overrides'];
export type ViteVercelPrerenderFn = (
  resolvedConfig: ResolvedConfig,
) => ViteVercelPrerenderRoute | Promise<ViteVercelPrerenderRoute>;

export interface ViteVercelApiEntry {
  /**
   * Path to entry file, or stdin config
   */
  source: string | StdinOptions;
  /**
   * Relative to `.vercel/output/functions`, without extension
   */
  destination: string;
  /**
   * Override esbuild options
   */
  buildOptions?: BuildOptions;
  /**
   * Automatically add a route for the function (mimics defaults Vercel behavior)
   * Set to `false` to disable
   */
  addRoute?: boolean;
}
