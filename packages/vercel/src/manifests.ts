import { ResolvedConfig } from 'vite';
import {
  FunctionsManifest,
  PrerenderManifest,
  PrerenderManifestDynamicRoute,
  PrerenderManifestRoute,
  RoutesManifest,
  ViteVercelPrerenderRoute,
} from './types';
import path from 'path';
import { getRoot } from './utils';
import { assert } from './assert';

// Prerender manifest

export function getPrerenderManifest(
  resolvedConfig: ResolvedConfig,
  isrPages: ViteVercelPrerenderRoute['isr'],
): PrerenderManifest {
  const prerenderManifestDefault = resolvedConfig.vercel?.prerenderManifest;

  const routes = Object.entries(isrPages?.routes ?? {}).reduce(
    (acc, [key, val]) => {
      const srcRoute =
        val?.srcRoute ?? prerenderManifestDefault?.routes?.[key]?.srcRoute;

      assert(
        typeof srcRoute === 'string',
        `\`[prerender-manifest] { srcRoute }\` is required for route ${key}`,
      );

      acc[key === '/' ? '/index' : key] = {
        initialRevalidateSeconds:
          val?.initialRevalidateSeconds ??
          prerenderManifestDefault?.routes?.[key]?.initialRevalidateSeconds ??
          resolvedConfig.vercel?.initialRevalidateSeconds ??
          30,
        srcRoute: srcRoute,
        dataRoute:
          val?.dataRoute ??
          prerenderManifestDefault?.routes?.[key]?.dataRoute ??
          '',
      };
      return acc;
    },
    {} as Record<string, PrerenderManifestRoute>,
  );

  const uniqueRoutes = Array.from(
    new Set(Object.values(routes).map((r) => r.srcRoute)),
  );
  const dynamicRoutes = uniqueRoutes.reduce((acc, cur) => {
    acc[cur] = {
      routeRegex: '^' + cur + '$',
      dataRoute:
        prerenderManifestDefault?.dynamicRoutes?.[cur]?.dataRoute ?? '',
      fallback:
        prerenderManifestDefault?.dynamicRoutes?.[cur]?.fallback ?? null,
      dataRouteRegex:
        prerenderManifestDefault?.dynamicRoutes?.[cur]?.dataRouteRegex ?? '',
    };
    return acc;
  }, {} as Record<string, PrerenderManifestDynamicRoute>);

  return {
    version: 3,
    routes,
    dynamicRoutes,
    preview: prerenderManifestDefault?.preview ?? {
      previewModeId: null,
    },
  };
}

export function getPrerenderManifestDestination(
  resolvedConfig: ResolvedConfig,
) {
  return path.join(
    getRoot(resolvedConfig),
    '.output',
    'prerender-manifest.json',
  );
}

// Routes manifest

export function getRoutesManifest(
  resolvedConfig: ResolvedConfig,
  ssr: ViteVercelPrerenderRoute['ssr'],
): RoutesManifest {
  const routesManifest = resolvedConfig.vercel?.routesManifest;

  const allRewrites: NonNullable<RoutesManifest['rewrites']> = [
    ...(ssr?.rewrites ?? []),
    ...(routesManifest?.rewrites ?? []),
  ];

  return {
    version: 3,
    basePath: routesManifest?.basePath ?? '/',
    pages404: routesManifest?.pages404 ?? true,
    dynamicRoutes: routesManifest?.dynamicRoutes,
    rewrites: allRewrites.length > 0 ? allRewrites : undefined,
    redirects: routesManifest?.redirects,
    headers: routesManifest?.headers,
  };
}

export function getRoutesManifestDestination(resolvedConfig: ResolvedConfig) {
  return path.join(getRoot(resolvedConfig), '.output', 'routes-manifest.json');
}

// Functions manifest

export function getFunctionsManifest(
  pages: FunctionsManifest['pages'],
): FunctionsManifest {
  return {
    version: 1,
    pages,
  };
}

export function getFunctionsManifestDestination(
  resolvedConfig: ResolvedConfig,
) {
  return path.join(
    getRoot(resolvedConfig),
    '.output',
    'functions-manifest.json',
  );
}
