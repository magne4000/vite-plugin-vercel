// FIXME esbuild bug https://github.com/evanw/esbuild/pull/2067
// probably not necessary when this will be included in `vite-plugin-ssr`
import module from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
globalThis.require = module.createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
globalThis.__dirname = path.dirname(__filename);
