import { photonEntryDestinationDefault } from "./destination";
import type { Photon } from "@photonjs/core";
import { toPathToRegexpV6 } from "convert-route/path-to-regexp-v6";
import { fromNextFs } from "convert-route/next-fs";
import { assert } from "../assert";
import path from "node:path";
import { toRou3 } from "convert-route";

// @vercel/routing-utils respects path-to-regexp v6 syntax
export function entryToPathtoregex(entry: Photon.EntryBase) {
  assert(typeof entry.vercel?.route !== "string", "Do not pass entry with route string to entryToPathtoregex");
  return toPathToRegexpV6(fromNextFs(path.posix.resolve("/", photonEntryDestinationDefault(entry))));
}

export function entryToRou3(entry: Photon.EntryBase) {
  assert(typeof entry.vercel?.route !== "string", "Do not pass entry with route string to entryToPathtoregex");
  return toRou3(fromNextFs(path.posix.resolve("/", photonEntryDestinationDefault(entry))));
}
