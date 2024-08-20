export function escapeStringRegexp(str: string) {
  return str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
}

function getSegmentRegex(segment: string): string {
  if (segment.startsWith("@")) {
    return "/[^/]+";
  }
  if (segment === "*") {
    return "/.+?";
  }
  return `/${segment}`;
}

export function getParametrizedRoute(route: string): string {
  const segments = (route.replace(/\/$/, "") || "/").slice(1).split("/");
  return segments.map(getSegmentRegex).join("");
}

export function getRoutesRegex(normalizedRoutes: string[]): string {
  const results = normalizedRoutes.map(getParametrizedRoute);
  return `^(${results.join("|")})(?:/)?$`;
}

export function getComplementaryRoutesRegex(normalizedRoutes: string[]): string {
  const results = normalizedRoutes.map(getParametrizedRoute);
  return results.map((r) => `(?!${r})`).join("");
}

export function getVercelPattern(route: string): string {
  if (route.endsWith("/*")) {
    return route.replace(/\/\*/g, "/:any*");
  }
  return route;
}
