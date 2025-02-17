import type { PageContextServer } from "vike/types";

export function route(pageContext: PageContextServer) {
  if (!pageContext.urlPathname.startsWith("/function/")) return false;
  return {
    precedence: -1,
  };
}
