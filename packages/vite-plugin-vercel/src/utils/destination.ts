import { createHash } from "node:crypto";
import path from "node:path";
import type { EntryMeta } from "@universal-deploy/store";
import { removeExtension } from "./extension";
import { pathRelativeTo } from "./path";

function shortHash(obj: unknown) {
  const str = JSON.stringify(obj, (_key, val) => {
    // URLPattern always stringifies as `{}` by default
    // @ts-expect-error
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

export function entryDestinationDefault(root: string, entry: EntryMeta) {
  const rel = pathRelativeTo(entry.id, root);
  return `${removeExtension(rel).replace(/[^a-zA-Z0-9\-_[\]/]/g, "-")}-${shortHash(entry)}`;
}

export function entryDestination(
  root: string,
  entry: EntryMeta,
  postfix: `.func/index` | `.func/.vc-config.json` | `.func/package.json` | `.prerender-config.json`,
) {
  return `${path.posix.join("functions/", entryDestinationDefault(root, entry))}${postfix}`;
}
