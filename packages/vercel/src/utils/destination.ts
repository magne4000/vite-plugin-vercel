import path from "node:path";
import type { Photon } from "@photonjs/core";

export function photonEntryDestinationDefault(entry: Photon.EntryBase) {
  return entry.vercel?.destination ?? entry.name.replace(/[^a-zA-Z0-9\-_[\]/]/g, "-");
}

export function photonEntryDestination(
  entry: Photon.EntryBase,
  postfix: `.func/index` | `.func/.vc-config.json` | `.func/package.json` | `.prerender-config.json`,
) {
  return `${path.posix.join("functions/", photonEntryDestinationDefault(entry))}${postfix}`;
}
