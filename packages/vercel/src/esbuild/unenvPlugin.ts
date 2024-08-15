// credits:
// https://github.com/cloudflare/workers-sdk/blob/e24939c53475228e12a3c5228aa652c6473a889f/packages/wrangler/src/deployment-bundle/esbuild-plugins/hybrid-nodejs-compat.ts

import type { Plugin, PluginBuild } from 'esbuild';
import { builtinModules, createRequire } from 'node:module';
import path from 'node:path';
import resolveFrom from 'resolve-from';
import { env, nodeless, vercel } from 'unenv-nightly';
import { packagePath } from '../utils';

const require_ = createRequire(import.meta.url);

const NODE_REQUIRE_NAMESPACE = 'node-require';
const UNENV_GLOBALS_RE = /_virtual_unenv_inject-([^.]+)\.js$/;

const UNENV_REGEX = /\bunenv\b/g;
const NODEJS_MODULES_RE = new RegExp(`^(node:)?(${builtinModules.join('|')})$`);

function replaceUnenv<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(UNENV_REGEX, 'unenv-nightly') as T;
  }

  if (Array.isArray(value)) {
    return value.map(replaceUnenv) as T;
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, replaceUnenv(v)]),
    ) as T;
  }

  return value;
}

export function unenvPlugin(): Plugin {
  const { alias, inject, external, polyfill } = replaceUnenv(
    env(nodeless, vercel),
  );

  // already included in polyfill
  delete inject.global;
  delete inject.process;
  delete inject.Buffer;
  delete inject.performance;

  return {
    name: 'unenv',
    setup(build: PluginBuild) {
      handlePolyfills(build, polyfill);
      handleRequireCallsToNodeJSBuiltins(build);
      handleAliasedNodeJSPackages(build, alias, external);
      handleNodeJSGlobals(build, inject);
    },
  };
}

function handlePolyfills(build: PluginBuild, polyfill: string[]): void {
  if (polyfill.length === 0) return;

  build.initialOptions.inject = [
    ...(build.initialOptions.inject ?? []),
    ...polyfill.map((id) =>
      resolveFrom(packagePath, id).replace(/\.cjs$/, '.mjs'),
    ),
  ];
}

function handleRequireCallsToNodeJSBuiltins(build: PluginBuild): void {
  build.onResolve({ filter: NODEJS_MODULES_RE }, (args) => {
    if (args.kind === 'require-call') {
      return {
        path: args.path,
        namespace: NODE_REQUIRE_NAMESPACE,
      };
    }
  });

  build.onLoad(
    { filter: /.*/, namespace: NODE_REQUIRE_NAMESPACE },
    ({ path: modulePath }) => ({
      contents: `
        import libDefault from '${modulePath}';
        export default libDefault;
      `,
      loader: 'js',
    }),
  );
}

function handleAliasedNodeJSPackages(
  build: PluginBuild,
  alias: Record<string, string>,
  external: string[],
): void {
  // esbuild expects alias paths to be absolute
  const aliasAbsolute = Object.fromEntries(
    Object.entries(alias)
      .map(([key, value]) => {
        let resolvedAliasPath;
        try {
          resolvedAliasPath = require_.resolve(value);
        } catch (e) {
          // this is an alias for package that is not installed in the current app => ignore
          resolvedAliasPath = '';
        }

        return [key, resolvedAliasPath.replace(/\.cjs$/, '.mjs')];
      })
      .filter((entry) => entry[1] !== ''),
  );
  const UNENV_ALIAS_RE = new RegExp(
    `^(${Object.keys(aliasAbsolute).join('|')})$`,
  );

  build.onResolve({ filter: UNENV_ALIAS_RE }, (args) => {
    // Resolve the alias to its absolute path and potentially mark it as external
    return {
      path: aliasAbsolute[args.path],
      external: external.includes(alias[args.path]),
    };
  });
}

function handleNodeJSGlobals(
  build: PluginBuild,
  inject: Record<string, string | string[]>,
): void {
  build.initialOptions.inject = [
    ...(build.initialOptions.inject ?? []),
    ...Object.keys(inject).map((globalName) =>
      path.resolve(
        packagePath,
        `_virtual_unenv_inject-${encodeToLowerCase(globalName)}.js`,
      ),
    ),
  ];

  build.onResolve({ filter: UNENV_GLOBALS_RE }, ({ path: filePath }) => {
    console.log({ filePath });

    return {
      path: filePath,
    };
  });

  build.onLoad({ filter: UNENV_GLOBALS_RE }, ({ path: filePath }) => {
    const match = filePath.match(UNENV_GLOBALS_RE);
    if (!match) {
      throw new Error(`Invalid global polyfill path: ${filePath}`);
    }

    const globalName = decodeFromLowerCase(match[1]);
    const globalMapping = inject[globalName];

    console.log({ globalMapping, filePath });

    if (typeof globalMapping === 'string') {
      return handleStringGlobalMapping(globalName, globalMapping);
    } else if (Array.isArray(globalMapping)) {
      return handleArrayGlobalMapping(globalName, globalMapping);
    } else {
      throw new Error(`Invalid global mapping for ${globalName}`);
    }
  });
}

function handleStringGlobalMapping(globalName: string, globalMapping: string) {
  // workaround for wrongly published unenv
  const possiblePaths = [globalMapping, `${globalMapping}/index`];
  // the absolute path of the file
  let found = '';
  for (const p of possiblePaths) {
    try {
      // mjs to support tree-shaking
      found ||= resolveFrom(packagePath, p).replace(/\.cjs$/, '.mjs');
      if (found) {
        break;
      }
    } catch (error) {
      // ignore
    }
  }

  if (!found) {
    throw new Error(`Could not resolve global mapping for ${globalName}`);
  }

  return {
    contents: `
      import globalVar from "${found}";
      const exportable = /* @__PURE__ */ (() => globalThis.${globalName} = globalVar)();
      export { exportable as '${globalName}', exportable as 'globalThis.${globalName}' };
    `,
  };
}

function handleArrayGlobalMapping(
  globalName: string,
  globalMapping: string[],
): { contents: string } {
  const [moduleName, exportName] = globalMapping;
  return {
    contents: `
      import { ${exportName} } from "${moduleName}";
      const exportable = /* @__PURE__ */ (() => globalThis.${globalName} = ${exportName})();
      export { exportable as '${globalName}', exportable as 'global.${globalName}', exportable as 'globalThis.${globalName}' };
    `,
  };
}

export function encodeToLowerCase(str: string): string {
  return str
    .replace(/\$/g, '$$')
    .replace(/[A-Z]/g, (letter) => `$${letter.toLowerCase()}`);
}

export function decodeFromLowerCase(str: string): string {
  return str.replace(/\$(.)/g, (_, letter) => letter.toUpperCase());
}
