import { parse } from "qs";

export function getOriginalUrl(xNowRouteMatchesHeader: unknown, originalPath: unknown, url?: string) {
  const matches =
    // FIXME x-now-route-matches is not definitive https://github.com/orgs/vercel/discussions/577#discussioncomment-2769478
    typeof xNowRouteMatchesHeader === "string" ? parse(xNowRouteMatchesHeader) : null;
  return typeof originalPath === "string"
    ? originalPath
    : matches && typeof matches?.["1"] === "string"
      ? matches["1"]
      : url ?? "";
}
