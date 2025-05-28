/// <reference types="@photonjs/core/api" />
import path from "node:path";
import glob from "fast-glob";
import '../types'
import { type ASTNode, generateCode, loadFile } from "magicast";
import { normalizePath } from "vite";
import { type VercelEndpointExports, vercelEndpointExports } from "../schemas/exports";

export async function getEntriesFromFs(
  dir: string,
  { destination = dir, tryParseExports = true },
): Promise<Record<string, Photon.Entry>> {
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
    entryPoints[key] = {
      id: filePath,
      type: "universal-handler",
      // FIXME properly convert to rou3 format
      route: key,
      vercel: {
        destination: key,
        route: true,
        edge: xports?.edge,
        isr: xports?.isr,
        headers: xports?.headers,
        streaming: xports?.streaming,
      },
    };
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
