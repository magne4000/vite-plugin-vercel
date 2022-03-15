import { ResolvedConfig } from 'vite';
import {
  FunctionsManifest,
  PrerenderManifest,
  PrerenderManifestDynamicRoute,
  PrerenderManifestRoute,
  RoutesManifest,
} from './types';
import path from 'path';
import { getRoot } from './utils';
import { assert } from './assert';

// Prerender manifest

export function getPrerenderManifest(
  resolvedConfig: ResolvedConfig,
  isrPages: string[],
): PrerenderManifest {
  const isr = resolvedConfig.vercel?.isr;
  const prerenderManifestDefault = resolvedConfig.vercel?.prerenderManifest;

  const routes = isrPages.reduce((acc, cur) => {
    const srcRoute = prerenderManifestDefault?.routes?.[cur]?.srcRoute;

    assert(
      typeof srcRoute === 'string',
      `\`[prerender-manifest] { srcRoute }\` is required for route ${cur}`,
    );

    acc[cur === '/' ? '/index' : cur] = {
      initialRevalidateSeconds:
        prerenderManifestDefault?.routes?.[cur]?.initialRevalidateSeconds ??
        isr?.initialRevalidateSeconds ??
        30,
      srcRoute: srcRoute,
      dataRoute: prerenderManifestDefault?.routes?.[cur]?.dataRoute ?? '',
    };
    return acc;
  }, {} as Record<string, PrerenderManifestRoute>);

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
  return path.join(getRoot(resolvedConfig), '.output/prerender-manifest.json');
}

// Routes manifest

export function getRoutesManifest(
  resolvedConfig: ResolvedConfig,
): RoutesManifest {
  const routesManifest = resolvedConfig.vercel?.routesManifest;

  return {
    version: 3,
    basePath: routesManifest?.basePath ?? '/',
    pages404: routesManifest?.pages404 ?? true,
    dynamicRoutes: routesManifest?.dynamicRoutes,
    rewrites: routesManifest?.rewrites,
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
