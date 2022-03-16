import type { ResolvedConfig } from 'vite';

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
  isr?: {
    initialRevalidateSeconds?: number;
    prerender?: ViteVercelPrerenderFn;
  };
  apiEndpoints?: string[];
  ssrEndpoint?: string;
  functionsManifest?: Partial<Omit<FunctionsManifest, 'version'>>;
  routesManifest?: RoutesManifestDefault;
  prerenderManifest?: PrerenderManifestDefault;
}

export type ViteVercelPrerenderRoute = {
  isr?: Pick<PrerenderManifestDefault, 'routes'>;
  ssr?: Pick<RoutesManifestDefault, 'rewrites'>;
};
export type ViteVercelPrerenderFn = (
  resolvedConfig: ResolvedConfig,
) => ViteVercelPrerenderRoute | Promise<ViteVercelPrerenderRoute>;
