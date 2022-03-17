import type { ResolvedConfig } from 'vite';
import { BuildOptions, StdinOptions } from 'esbuild';

// RoutesManifest

export interface RoutesManifest {
  version: 3;
  basePath: string;
  pages404: boolean;
  redirects?: RoutesManifestRedirect[];
  headers?: RoutesManifestHeader[];
  rewrites?: RoutesManifestRewrite[];
  dynamicRoutes?: RoutesManifestDynamicRoute[];
}

export interface RoutesManifestRedirect {
  source: string;
  destination: string;
  statusCode: 301 | 302 | 307 | 308;
  regex: string;
}

export interface RoutesManifestHeader {
  source: string;
  headers: { key: string; value: string }[];
  regex: string;
}

export interface RoutesManifestRewrite {
  source: string;
  has?: {
    type: 'header' | 'cookie' | 'host' | 'query';
    key: string;
    value: string;
  }[];
  destination: string;
  regex: string;
}

export interface RoutesManifestDynamicRoute {
  page: string;
  regex: string;
  routeKeys?: Record<string, string>;
  namedRegex?: string;
}

export interface RoutesManifestDefault {
  basePath?: string;
  pages404?: boolean;
  redirects?: RoutesManifestRedirect[];
  headers?: RoutesManifestHeader[];
  rewrites?: RoutesManifestRewrite[];
  dynamicRoutes?: RoutesManifestDynamicRoute[];
}

// FunctionsManifest

export interface FunctionsManifest {
  version: 1;
  pages: { '_middleware.js'?: FunctionsManifestPageWeb } & Record<
    string,
    Partial<FunctionsManifestPageWeb> | FunctionsManifestPage
  >;
}

export interface FunctionsManifestPage {
  memory?: number;
  maxDuration?: number;
  regions?: string[];
  runtime?: string;
  handler?: string;
}

export interface FunctionsManifestPageWeb extends FunctionsManifestPage {
  runtime: 'web';
  env: string[];
  files: string[];
  name: string;
  page: string;
  regexp: string;
  sortingIndex: number;
}

// PrerenderManifest

export interface PrerenderManifest {
  version: 3;
  routes: Record<string, PrerenderManifestRoute>;
  dynamicRoutes: Record<string, PrerenderManifestDynamicRoute>;
  preview: { previewModeId: string | null };
}

export interface PrerenderManifestRoute {
  initialRevalidateSeconds: number;
  srcRoute: string;
  dataRoute: string;
}

export interface PrerenderManifestDynamicRoute {
  routeRegex: string;
  fallback: string | null;
  dataRoute: string;
  dataRouteRegex: string;
}

export interface PrerenderManifestDefault {
  routes?: Record<string, Partial<PrerenderManifestRoute>>;
  dynamicRoutes?: Record<
    string,
    Partial<Omit<PrerenderManifestDynamicRoute, 'routeRegex'>>
  >;
  preview?: { previewModeId: string | null };
}

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
   * By default, all `api/*` endpoints are compiled under `.ouput/server/pages` and `.ouput/server/pages/api`.
   * If a file must be compiled only under `.ouput/server/pages/api`, it should be added here.
   *
   * @example
   * ```
   * {
   *   apiEndpoints: ['./api/post.ts']
   * }
   * ```
   */
  apiEndpoints?: string[];
  /**
   * All provided endpoints will also be part of the build process.
   * For instance, a framework can leverage this to have a generic ssr endpoint
   * without requiring the user to write any code.
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
}

export type ViteVercelPrerenderRoute = {
  isr?: Pick<PrerenderManifestDefault, 'routes'>;
  ssr?: Pick<RoutesManifestDefault, 'rewrites'>;
};
export type ViteVercelPrerenderFn = (
  resolvedConfig: ResolvedConfig,
) => ViteVercelPrerenderRoute | Promise<ViteVercelPrerenderRoute>;

export interface ViteVercelApiEntry {
  source: string | StdinOptions;
  /**
   * Relative to `.output/server/pages`, without extension
   */
  destination: string | string[];
  buildOptions?: BuildOptions;
}
