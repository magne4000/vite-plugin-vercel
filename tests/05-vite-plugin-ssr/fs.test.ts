import { testFs } from '../helpers';

describe('fs', function () {
  const buildManifest = require('../../dist/client/manifest.json');

  const generatedFiles = Object.values(buildManifest)
    .filter((e: any): e is any => Boolean(e.file))
    .map((e) => [e.file, ...(e.assets ?? []), ...(e.css ?? [])])
    .flat(1)
    .filter((f) => f.startsWith('assets/'));

  testFs([
    '.output/server/pages/api/post.js',
    '.output/static/tests/common/index.html',
    '.output/functions-manifest.json',
    '.output/prerender-manifest.json',
    '.output/routes-manifest.json',
    '.output/static/manifest.json',
    '.output/static/vite-plugin-ssr.json',
    ...generatedFiles.map((f) => '.output/static/' + f),
    // ISR + Static pages
    '.output/server/pages/404.html',
    '.output/server/pages/api/ssr_.js',
    '.output/server/pages/index.html',
    '.output/server/pages/isr.html',
    '.output/server/pages/ssr_.js',
    '.output/server/pages/static.html',
  ]);
});
