import path from "node:path";
import type { EntryMeta } from "@universal-deploy/store";
import { removeExtension } from "./extension";
import { pathRelativeTo } from "./path";

function parseViteId(id: string) {
  const [path, query] = id.split("?");
  return { path: decodeURIComponent(path), query };
}

function extractBestPath({ path, query }: { path: string; query?: string }) {
  if (!query) return path;

  const parts = query.split("&").map(decodeURIComponent);
  // pick the part that looks most like a path (contains /)
  const candidate = parts.find((p) => p.includes("/"));
  return candidate || path;
}

function shortenPath(path: string, maxSegments = 2) {
  const segments = path.split(/[\\/]/).filter(Boolean);
  const lastSegments = segments.slice(-maxSegments);
  const name = lastSegments.join("_");
  return removeExtension(name);
}

function mapPath(path: string, maxSegments = 2) {
  const nodeModuleMatch = path.match(/node_modules[\\/](.+?)([\\/].*)?$/);
  if (nodeModuleMatch) {
    const pkg = nodeModuleMatch[1].split(/[\\/]/)[0];
    const file = nodeModuleMatch[2]?.split(/[\\/]/).pop() || "index";
    return `${pkg}_${removeExtension(file)}`;
  }
  return shortenPath(path, maxSegments);
}

function hashString(str: string, length = 6) {
  // Simple deterministic hash: DJB2 variant
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  hash = hash >>> 0; // force positive
  return hash.toString(36).slice(0, length); // base36, short
}

function uniqueViteName(id: string, maxSegments = 2) {
  const parsed = parseViteId(id);
  const bestPath = extractBestPath(parsed);
  const base = mapPath(bestPath, maxSegments); // short readable name
  const hash = hashString(id); // hash of full id ensures uniqueness
  return removeExtension(`${base}_${hash}`.replace(/[^a-zA-Z0-9\-_[\]/]/g, "-"));
}

export function entryDestinationDefault(root: string, entry: EntryMeta) {
  const rel = pathRelativeTo(entry.id, root);
  return uniqueViteName(rel);
}

export function entryDestination(
  root: string,
  entry: EntryMeta,
  postfix: `.func/index` | `.func/.vc-config.json` | `.func/package.json` | `.prerender-config.json`,
) {
  return `${path.posix.join("functions/", entryDestinationDefault(root, entry))}${postfix}`;
}
