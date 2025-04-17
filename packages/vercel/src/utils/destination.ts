import path from "node:path";

export function photonEntryDestinationDefault(entry: Photon.Entry) {
  return entry.vercel?.destination ?? entry.id.replace(/[^a-zA-Z0-9\-_]/g, "-");
}

export function photonEntryDestination(
  entry: Photon.Entry,
  postfix: `.func/index` | `.func/.vc-config.json` | `.prerender-config.json`,
) {
  return `${path.posix.join("functions/", photonEntryDestinationDefault(entry))}${postfix}`;
}
