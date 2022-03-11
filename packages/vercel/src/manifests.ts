import { ResolvedConfig } from 'vite';
import {
  FunctionsManifest,
  PrerenderManifest,
  PrerenderManifestRoute,
  RoutesManifest,
  RoutesManifestDynamicRoutePlugin,
} from './types';
import path from 'path';
import { getRoot } from './utils';

// Prerender manifest

export function getPrerenderManifest(
  isrPages: string[],
  dynamicRoutes: RoutesManifestDynamicRoutePlugin[],
): PrerenderManifest {
  // TODO assert
  const ssrRoute = dynamicRoutes.find((r) => r.ssr);
  if (!ssrRoute) {
    throw new Error('ssrRoute missing');
  }

  const routes = isrPages.reduce((acc, cur) => {
    acc[cur === '/' ? '/index' : cur] = {
      initialRevalidateSeconds: 30,
      srcRoute: ssrRoute.page,
      dataRoute: '',
    };
    return acc;
  }, {} as Record<string, PrerenderManifestRoute>);

  return {
    version: 3,
    routes,
    dynamicRoutes: {
      [ssrRoute.page]: {
        routeRegex: '^' + ssrRoute.page + '$',
        dataRoute: '',
        fallback: null,
        dataRouteRegex: '',
      },
    },
    preview: {
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
  dynamicRoutes: RoutesManifestDynamicRoutePlugin[],
): RoutesManifest {
  return {
    version: 3,
    basePath: '/',
    pages404: true,
    dynamicRoutes: dynamicRoutes.map((r) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ssr, ...rest } = r;
      return rest;
    }),
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
