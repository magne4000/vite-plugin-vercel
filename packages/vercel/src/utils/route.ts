import { photonEntryDestinationDefault } from "./destination";
import type { Photon } from "@photonjs/core";
import { assert } from "../assert";
import path from "node:path";

// @vercel/routing-utils respects path-to-regexp v6 syntax
export function entryToPathtoregex(entry: Photon.Entry) {
  assert(typeof entry.vercel?.route !== "string", "Do not pass entry with route string to entryToPathtoregex");
  return path.posix
    .resolve("/", photonEntryDestinationDefault(entry))
    .split("/")
    .map((segment) =>
      segment
        .replace(/^\[\[\.\.\.([^/]+)\]\]$/g, ":$1*")
        .replace(/^\[\[([^/]+)\]\]$/g, ":$1?")
        .replace(/^\[\.\.\.([^/]+)\]$/g, ":$1+")
        .replace(/^\[([^/]+)\]$/g, ":$1"),
    )
    .join("/");
}

export function entryToRou3(entry: Photon.Entry) {
  assert(typeof entry.vercel?.route !== "string", "Do not pass entry with route string to entryToPathtoregex");
  return path.posix
    .resolve("/", photonEntryDestinationDefault(entry))
    .split("/")
    .map((segment) =>
      segment
        .replace(/^\[\[\.\.\.([^/]+)\]\]$/g, "**:$1")
        .replace(/^\[\[([^/]+)\]\]$/g, "*:$1")
        .replace(/^\[\.\.\.([^/]+)\]$/g, "**:$1")
        .replace(/^\[([^/]+)\]$/g, ":$1"),
    )
    .join("/");
}

export function rou3ToPathtoregex(rou3route: string) {
  return rou3route
    .split("/")
    .map((segment) =>
      segment
        .replace(/^\*$/g, ":splat?")
        .replace(/^\*\*$/g, ":splat*")
        .replace(/^\*\*:([^/]+)$/g, ":$1*")
        .replace(/^:([^/]+)$/g, ":$1"),
    )
    .join("/");
}
