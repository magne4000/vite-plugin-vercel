import type { PageContextClient, PageContextServer } from "vike/types";

export function route(pageContext: PageContextServer | PageContextClient) {
  if (!pageContext.urlPathname.startsWith("/function/")) return false;
  return {
    precedence: -1,
  };
}
