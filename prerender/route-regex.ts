import { RoutesManifestDynamicRoute } from 'vite-plugin-vercel';

interface Segment {
  page: string;
  regex: string;
  routeKey?: [string, string];
  namedRegex: string;
}

export function escapeStringRegexp(str: string) {
  return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

function getCleanKey(key: string, getSafeRouteKey: () => string) {
  let cleanedKey = key.replace(/\W/g, '');
  let invalidKey = false;

  // check if the key is still invalid and fallback to using a known
  // safe key
  if (cleanedKey.length === 0 || cleanedKey.length > 30) {
    invalidKey = true;
  }
  if (!isNaN(parseInt(cleanedKey[0]))) {
    invalidKey = true;
  }

  if (invalidKey) {
    cleanedKey = getSafeRouteKey();
  }

  return cleanedKey;
}

function getSegmentInfo(
  segment: string,
  getSafeRouteKey: () => string,
): Segment {
  if (segment.startsWith(':')) {
    const cleanedKey = getCleanKey(segment.slice(1), getSafeRouteKey);

    return {
      regex: '/([^/]+?)',
      routeKey: [cleanedKey, cleanedKey],
      namedRegex: `/(?<${cleanedKey}>[^/]+?)`,
      page: `/[${cleanedKey}]`,
    };
  } else if (segment === '*') {
    const cleanedKey = getCleanKey('', getSafeRouteKey);

    return {
      regex: '/(.+?)',
      routeKey: [cleanedKey, cleanedKey],
      namedRegex: `/(?<${cleanedKey}>.+?)`,
      page: `/[${cleanedKey}]`,
    };
  } else {
    return {
      regex: `/${escapeStringRegexp(segment)}`,
      namedRegex: `/${escapeStringRegexp(segment)}`,
      page: `/${segment}`,
    };
  }
}

export function getParametrizedRoute(route: string) {
  const segments = (route.replace(/\/$/, '') || '/').slice(1).split('/');

  let routeKeyCharCode = 97;
  let routeKeyCharLength = 1;

  // builds a minimal routeKey using only a-z and minimal number of characters
  const getSafeRouteKey = () => {
    let routeKey = '';

    for (let i = 0; i < routeKeyCharLength; i++) {
      routeKey += String.fromCharCode(routeKeyCharCode);
      routeKeyCharCode++;

      if (routeKeyCharCode > 122) {
        routeKeyCharLength++;
        routeKeyCharCode = 97;
      }
    }
    return routeKey;
  };

  const segmentInfos = segments.map((segment) =>
    getSegmentInfo(segment, getSafeRouteKey),
  );

  return {
    page: segmentInfos.map((info) => info.page).join(''),
    regex: segmentInfos.map((info) => info.regex).join(''),
    routeKeys: segmentInfos
      .map((info) => info.routeKey)
      .reduce((acc, cur) => {
        if (cur) {
          acc[cur[0]] = cur[1];
        }

        return acc;
      }, {} as Record<string, string>),
    namedRegex: segmentInfos.map((info) => info.namedRegex).join(''),
  };
}

export function getRouteRegex(
  normalizedRoute: string,
): RoutesManifestDynamicRoute {
  const result = getParametrizedRoute(normalizedRoute);
  return {
    page: '/api/ssr_',
    regex: `^${result.regex}(?:/)?$`,
    routeKeys: result.routeKeys,
    namedRegex: `^${result.namedRegex}(?:/)?$`,
  };
}
