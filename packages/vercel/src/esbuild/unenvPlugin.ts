// taken from https://github.com/cloudflare/workers-sdk/blob/e24939c53475228e12a3c5228aa652c6473a889f/packages/wrangler/src/deployment-bundle/esbuild-plugins/hybrid-nodejs-compat.ts

import type { Plugin, PluginBuild } from 'esbuild';
import { builtinModules } from 'node:module';
import nodePath from 'node:path';
import { env, nodeless, vercel } from 'unenv';
import { packagePath } from '../utils';

const REQUIRED_NODE_BUILT_IN_NAMESPACE = 'node-built-in-modules';

export const unenvPlugin: () => Plugin = () => {
  const { alias, inject, external } = env(nodeless, vercel);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { Buffer, ...rest } = inject;
  return {
    name: 'unenv',
    setup(build) {
      handleRequireCallsToNodeJSBuiltins(build);
      handleAliasedNodeJSPackages(build, alias, external);
      handleNodeJSGlobals(build, rest);
    },
  };
};

/**
 * We must convert `require()` calls for Node.js to a virtual ES Module that can be imported avoiding the require calls.
 * We do this by creating a special virtual ES module that re-exports the library in an onLoad handler.
 * The onLoad handler is triggered by matching the "namespace" added to the resolve.
 */
function handleRequireCallsToNodeJSBuiltins(build: PluginBuild) {
  const NODEJS_MODULES_RE = new RegExp(
    `^(node:)?(${builtinModules.join('|')})$`,
  );
  build.onResolve({ filter: NODEJS_MODULES_RE }, (args) => {
    if (args.kind === 'require-call') {
      return {
        path: args.path,
        namespace: REQUIRED_NODE_BUILT_IN_NAMESPACE,
      };
    }
  });
  build.onLoad(
    { filter: /.*/, namespace: REQUIRED_NODE_BUILT_IN_NAMESPACE },
    ({ path }) => {
      return {
        contents: [
          `import libDefault from '${path}';`,
          'export default libDefault;',
        ].join('\n'),
        loader: 'js',
      };
    },
  );
}

function handleAliasedNodeJSPackages(
  build: PluginBuild,
  alias: Record<string, string>,
  external: string[],
) {
  // esbuild expects alias paths to be absolute
  const aliasAbsolute = Object.fromEntries(
    Object.entries(alias)
      .map(([key, value]) => {
        let resolvedAliasPath;
        try {
          resolvedAliasPath = require.resolve(value);
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

/**
 * Inject node globals defined in unenv's `inject` config via virtual modules
 */
function handleNodeJSGlobals(
  build: PluginBuild,
  inject: Record<string, string | string[]>,
) {
  const UNENV_GLOBALS_RE = /_virtual_unenv_global_polyfill-([^.]+)\.js$/;

  build.initialOptions.inject = [
    ...(build.initialOptions.inject ?? []),
    //convert unenv's inject keys to absolute specifiers of custom virtual modules that will be provided via a custom onLoad
    ...Object.keys(inject).map((globalName) =>
      nodePath.resolve(
        packagePath,
        `_virtual_unenv_global_polyfill-${encodeToLowerCase(globalName)}.js`,
      ),
    ),
  ];

  build.onResolve({ filter: UNENV_GLOBALS_RE }, ({ path }) => ({ path }));

  build.onLoad({ filter: UNENV_GLOBALS_RE }, ({ path }) => {
    // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
    const globalName = decodeFromLowerCase(path.match(UNENV_GLOBALS_RE)![1]);
    const globalMapping = inject[globalName];

    if (typeof globalMapping === 'string') {
      const globalPolyfillSpecifier = globalMapping;
      return {
        contents: `
          import globalVar from "${globalPolyfillSpecifier}";

          ${
            /*
            // ESBuild's inject doesn't actually touch globalThis, so let's do it ourselves
            // by creating an exportable so that we can preserve the globalThis assignment if
            // the ${globalName} was found in the app, or tree-shake it, if it wasn't
            // see https://esbuild.github.io/api/#inject
            */ ''
          }
          const exportable =
            ${
              /*
              // mark this as a PURE call so it can be ignored and tree-shaken by ESBuild,
              // when we don't detect 'process', 'global.process', or 'globalThis.process'
              // in the app code
              // see https://esbuild.github.io/api/#tree-shaking-and-side-effects
              */ ''
            }
            /* @__PURE__ */ (() => {
              return globalThis.${globalName} = globalVar;
            })();

          export {
            exportable as '${globalName}',
            exportable as 'globalThis.${globalName}',
          }
        `,
      };
    }
    const [moduleName, exportName] = inject[globalName];

    return {
      contents: `
        import { ${exportName} } from "${moduleName}";

        ${
          /*
          // ESBuild's inject doesn't actually touch globalThis, so let's do it ourselves
          // by creating an exportable so that we can preserve the globalThis assignment if
          // the ${globalName} was found in the app, or tree-shake it, if it wasn't
          // see https://esbuild.github.io/api/#inject
          */ ''
        }
        const exportable =
          ${
            /*
            // mark this as a PURE call so it can be ignored and tree-shaken by ESBuild,
            // when we don't detect 'process', 'global.process', or 'globalThis.process'
            // in the app code
            // see https://esbuild.github.io/api/#tree-shaking-and-side-effects
            */ ''
          }
          /* @__PURE__ */ (() => {
            return globalThis.${globalName} = ${exportName};
          })();

        export {
          exportable as '${globalName}',
          exportable as 'global.${globalName}',
          exportable as 'globalThis.${globalName}'
        }
      `,
    };
  });
}

/**
 * Encodes a case sensitive string to lowercase string by prefixing all uppercase letters
 * with $ and turning them into lowercase letters.
 *
 * This function exists because ESBuild requires that all resolved paths are case insensitive.
 * Without this transformation, ESBuild will clobber /foo/bar.js with /foo/Bar.js
 *
 * This is important to support `inject` config for `performance` and `Performance` introduced
 * in https://github.com/unjs/unenv/pull/257
 */
export function encodeToLowerCase(str: string): string {
  return str
    .replaceAll(/\$/g, () => '$$')
    .replaceAll(/[A-Z]/g, (letter) => `$${letter.toLowerCase()}`);
}

/**
 * Decodes a string lowercased using `encodeToLowerCase` to the original strings
 */
export function decodeFromLowerCase(str: string): string {
  let out = '';
  let i = 0;
  while (i < str.length - 1) {
    if (str[i] === '$') {
      i++;
      out += str[i].toUpperCase();
    } else {
      out += str[i];
    }
    i++;
  }
  if (i < str.length) {
    out += str[i];
  }
  return out;
}
