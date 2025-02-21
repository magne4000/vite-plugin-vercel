import type { PageContext } from "vike/types";

export async function data(pageContext: PageContext) {
  return {
    someId: pageContext.routeParams.someId,
    d: String(new Date()),
  };
}
