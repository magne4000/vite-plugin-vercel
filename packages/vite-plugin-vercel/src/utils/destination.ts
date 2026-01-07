import path from "node:path";
import type { EntryMeta } from "@universal-deploy/store";
import { removeExtension } from "./extension";
import { pathRelativeTo } from "./path";

export function entryDestinationDefault(root: string, entry: EntryMeta) {
  const rel = pathRelativeTo(entry.id, root);
  return `${removeExtension(rel).replace(/[^a-zA-Z0-9\-_[\]/]/g, "-")}`;
}

export function entryDestination(
  root: string,
  entry: EntryMeta,
  postfix: `.func/index` | `.func/.vc-config.json` | `.func/package.json` | `.prerender-config.json`,
) {
  return `${path.posix.join("functions/", entryDestinationDefault(root, entry))}${postfix}`;
}
