import { createHash } from "node:crypto";
import path from "node:path";
import type { EntryMeta } from "@universal-deploy/store";

function shortHash(obj: unknown) {
  const str = JSON.stringify(obj, (key, val) => {
    // URLPattern always stringifies as `{}` by default
    // @ts-ignore
    if (typeof URLPattern !== "undefined" && val instanceof URLPattern) {
      return {
        pathname: val.pathname,
        search: val.search,
        hash: val.hash,
        protocol: val.protocol,
        hostname: val.hostname,
      };
    }
    return val;
  });

  return createHash("sha256").update(str).digest("hex").slice(0, 7);
}

export function photonEntryDestinationDefault(entry: EntryMeta) {
  return `${entry.id.replace(/[^a-zA-Z0-9\-_[\]/]/g, "-")}-${shortHash(entry)}`;
}

export function photonEntryDestination(
  entry: EntryMeta,
  postfix: `.func/index` | `.func/.vc-config.json` | `.func/package.json` | `.prerender-config.json`,
) {
  return `${path.posix.join("functions/", photonEntryDestinationDefault(entry))}${postfix}`;
}
