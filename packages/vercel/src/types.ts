import type { ResolvedConfig } from 'vite';
import type { BuildOptions, StdinOptions } from 'esbuild';
import type {
  RoutesManifest,
  RoutesManifestDynamicRoute,
  RoutesManifestDefault,
} from './schemas/manifests/routes';
import type { FunctionsManifest } from './schemas/manifests/functions';
import {
  PrerenderManifest,
  PrerenderManifestDefault,
  PrerenderManifestDynamicRoute,
  PrerenderManifestRoute,
} from './schemas/manifests/prerender';

// RoutesManifest

export type {
  RoutesManifest,
  RoutesManifestDynamicRoute,
  RoutesManifestDefault,
};

// FunctionsManifest

export type { FunctionsManifest };

// PrerenderManifest

export type {
  PrerenderManifest,
  PrerenderManifestRoute,
  PrerenderManifestDynamicRoute,
  PrerenderManifestDefault,
};

// Vite config for Vercel

export interface ViteVercelConfig {
  /**
   * If ISR is supported, default revalidation time per-page can be overriden.
   * A `prerender` function is necessary for ISR to work.
   * @see {@link https://vercel.com/docs/concepts/next.js/incremental-static-regeneration}
   */
  initialRevalidateSeconds?: number;
  /**
   * Also known as Server Side Generation, or SSG.
   * If present, must build static files in `.output/server/pages`.
   * Can be set to `false` to disable prerendering completely.
   */
  prerender?: ViteVercelPrerenderFn | false;
  /**
   * By default, all `api/*` endpoints are compiled under `.ouput/server/pages/api`.
   * If a file must also be compiled only under `.ouput/server/pages`, it should be added here.
   *
   * @example
   * ```
   * {
   *   pagesEndpoints: ['./api/page.ts']
   * }
   * ```
   */
  pagesEndpoints?: string[];
  /**
   * All provided endpoints will also be part of the build process.
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
   *       // relative to `.output/server/pages`, without extension
   *       destination: ['file', '/api/file'],
   *     }
   *   ]
   * }
   * ```
   */
  additionalEndpoints?: ViteVercelApiEntry[];
  /**
   * Advanced configuration to override funtions-manifest.json
   * @see {@link https://vercel.com/docs/file-system-api#configuration/functions}
   * @protected
   */
  functionsManifest?: Partial<Omit<FunctionsManifest, 'version'>>;
  /**
   * Advanced configuration to override routes-manifest.json
   * @see {@link https://vercel.com/docs/file-system-api#configuration/routes}
   * @protected
   */
  routesManifest?: RoutesManifestDefault;
  /**
   * Advanced configuration to override prerender-manifest.json
   * @see {@link https://vercel.com/docs/file-system-api#configuration/pre-rendering}
   * @protected
   */
  prerenderManifest?: PrerenderManifestDefault;
  /**
   * Defaults to `.output`. Mostly useful for testing prupose
   * @protected
   */
  outDir?: string;
}

export type ViteVercelPrerenderRoute = {
  isr?: Pick<PrerenderManifestDefault, 'routes'>;
  ssr?: Pick<RoutesManifestDefault, 'rewrites' | 'dynamicRoutes'>;
};
export type ViteVercelPrerenderFn = (
  resolvedConfig: ResolvedConfig,
) => ViteVercelPrerenderRoute | Promise<ViteVercelPrerenderRoute>;

export interface ViteVercelApiEntry {
  /**
   * Path to entry file, or stdin config
   */
  source: string | StdinOptions;
  /**
   * Relative to `.output/server/pages`, without extension
   */
  destination: string | string[];
  /**
   * Override esbuild options
   */
  buildOptions?: BuildOptions;
}
