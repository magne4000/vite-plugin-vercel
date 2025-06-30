import path from "node:path";
import glob from "fast-glob";
import "../types";
import { type ASTNode, generateCode, loadFile } from "magicast";
import { normalizePath } from "vite";
import type { Photon } from "@photonjs/core";
import { vercelEndpointExports, type VercelEndpointExports } from "@vite-plugin-vercel/schemas";
import { entryToRou3 } from "./route";

export async function getEntriesFromFs(
  dir: string,
  { destination = dir, tryParseExports = true },
): Promise<Record<string, Photon.EntryUniversalHandler>> {
  const normalizedDir = normalizePath(dir);
  destination = normalizePath(destination);
  const apiEntries = glob
    .sync(`${path.posix.resolve(normalizedDir)}/**/*.?(m)[jt]s?(x)`)
    // from Vercel doc: Files with the underscore prefix are not turned into Serverless Functions.
    .filter((filepath) => !path.basename(filepath).startsWith("_"));

  const entryPoints: Record<string, Photon.EntryUniversalHandler> = {};

  for (const filePath of apiEntries) {
    const outFilePath = pathRelativeTo(filePath, normalizedDir);
    const parsed = path.posix.parse(outFilePath);
    let xports: VercelEndpointExports | undefined | null = undefined;

    if (tryParseExports) {
      xports = await extractExports(filePath);
    }

    const key = path.posix.join(destination, parsed.dir, parsed.name);
    const entry = {
      id: filePath,
      name: key,
      type: "universal-handler",
      vercel: {
        route: true,
        destination: key,
        edge: xports?.edge,
        isr: xports?.isr,
        headers: xports?.headers,
        streaming: xports?.streaming,
      },
    } satisfies Photon.EntryUniversalHandler;
    (entry as Photon.EntryUniversalHandler).route = entryToRou3(entry);
    entryPoints[key] = entry;
  }

  return entryPoints;
}

export async function extractExports(filepath: string) {
  try {
    const mod = await loadFile(filepath);

    const subject = {
      edge: evalExport(mod.exports.edge),
      headers: evalExport(mod.exports.headers),
      streaming: evalExport(mod.exports.streaming),
      isr: evalExport(mod.exports.isr),
    };

    return vercelEndpointExports.parse(subject);
  } catch (e) {
    console.warn(`Warning: failed to read exports of '${filepath}'`, e);
    return null;
  }
}

function pathRelativeTo(filePath: string, rel: string): string {
  return normalizePath(path.relative(normalizePath(path.resolve(rel)), path.resolve(filePath)));
}

function isPrimitive(test: unknown) {
  return test !== Object(test);
}

function _eval(code: unknown): boolean {
  const func = new Function(`{ return function(){ return ${code} } };`);
  return func.call(null).call(null);
}

function evalExport(exp: unknown) {
  if (!exp) return;

  const code = isPrimitive(exp) ? exp : generateCode(exp as ASTNode).code;

  return _eval(code);
}
