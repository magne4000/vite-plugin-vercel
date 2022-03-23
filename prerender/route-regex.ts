export function escapeStringRegexp(str: string) {
  return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

function getSegmentRegex(segment: string): string {
  if (segment.startsWith(':')) {
    return '/([^/]+?)';
  } else if (segment === '*') {
    return '/(.+?)';
  }
  return `/${escapeStringRegexp(segment)}`;
}

export function getParametrizedRoute(route: string): string {
  const segments = (route.replace(/\/$/, '') || '/').slice(1).split('/');
  return segments.map(getSegmentRegex).join('');
}

export function getRoutesRegex(normalizedRoutes: string[]): string {
  const results = normalizedRoutes.map(getParametrizedRoute);
  return `^(${results.join('|')})(?:/)?$`;
}

export function getComplementaryRoutesRegex(
  normalizedRoutes: string[],
): string {
  const results = normalizedRoutes.map(getParametrizedRoute);
  return results.map((r) => `(?!${r})`).join('');
}
