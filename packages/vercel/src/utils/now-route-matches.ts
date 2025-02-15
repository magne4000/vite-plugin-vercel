/**
 * Encodes the params into a URLSearchParams object using the format that the
 * now builder uses for route matches
 *
 * @see {@link https://github.com/vercel/next.js/blob/c994df87a55c1912a99b4ca25cd5d5d5790c1dac/test/lib/next-test-utils.ts#L1624}
 * @param params - The params to encode.
 * @returns The encoded URLSearchParams object.
 */
export function createNowRouteMatches(params: Record<string, string>): URLSearchParams {
  const urlSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    urlSearchParams.append(key, value);
  }

  return urlSearchParams;
}
