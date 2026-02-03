import path from "node:path";
import type { EntryMeta } from "@universal-deploy/store";
import { type VercelEndpointExports, vercelEndpointExports } from "@vite-plugin-vercel/schemas";
import { fromNextFs } from "convert-route/next-fs";
import { toRou3 } from "convert-route/rou3";
import glob from "fast-glob";
import { type ASTNode, generateCode, loadFile } from "magicast";
import { normalizePath } from "vite";
import { pathRelativeTo } from "./utils/path";

export interface GetVercelEntriesOptions {
  /**
   * Map entries to URL patterns
   * @example
   *  // When dir: "endpoints/myapi" and destination: "api"
   *  //  endpoints/myapi/page.ts -> /api/page
   *  //  endpoints/myapi/name/[name].ts -> /api/name/*
   */
  destination?: string;
  /**
   * If true, parse entries exports for per-file settings.
   * Entries can export `edge`, `isr`, `headers` and `streaming`. See README for more details
   *
   * @default true
   */
  tryParseExports?: boolean;
}

/**
 * Scans the filesystem for entry points.
 * @beta
 */
export async function getVercelEntries(
  dir: string,
  { destination = dir, tryParseExports = true }: GetVercelEntriesOptions,
): Promise<EntryMeta[]> {
  const normalizedDir = normalizePath(dir);
  destination = normalizePath(destination);
  const apiEntries = glob
    .sync(`${path.posix.resolve(normalizedDir)}/**/*.?(m)[jt]s?(x)`)
    // from Vercel doc: Files with the underscore prefix are not turned into Serverless Functions.
    .filter((filepath) => !path.basename(filepath).startsWith("_"));

  const entryPoints: EntryMeta[] = [];

  for (const filePath of apiEntries) {
    const outFilePath = pathRelativeTo(filePath, normalizedDir);
    const parsed = path.posix.parse(outFilePath);
    let xports: VercelEndpointExports | undefined | null;

    if (tryParseExports) {
      xports = await extractExports(filePath);
    }

    const key = path.posix.join(destination, parsed.dir, parsed.name);
    const entry: Partial<EntryMeta> = {
      id: filePath,
      vercel: {},
    };
    // biome-ignore lint/style/noNonNullAssertion: ok
    if (xports?.edge) entry.vercel!.edge = xports.edge;
    // biome-ignore lint/style/noNonNullAssertion: ok
    if (xports?.isr) entry.vercel!.isr = xports.isr;
    // biome-ignore lint/style/noNonNullAssertion: ok
    if (xports?.headers) entry.vercel!.headers = xports.headers;
    // biome-ignore lint/style/noNonNullAssertion: ok
    if (xports?.streaming) entry.vercel!.streaming = xports.streaming;
    // FIXME migrate to URLPatternInit
    entry.pattern = entryToRou3(key);
    if (key.includes("[...")) {
      // biome-ignore lint/style/noNonNullAssertion: ok
      entry.vercel!.enforce = "post";
    }
    entryPoints.push(entry as EntryMeta);
  }

  return entryPoints;
}

function entryToRou3(key: string) {
  const res = toRou3(fromNextFs(path.posix.resolve("/", key)));
  // next-fs patterns cannot generate more than one rou3 pattern, so [0] is fine
  return res[0].replace(/\/index$/, "/");
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
