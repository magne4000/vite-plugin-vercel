import { testFs } from '../helpers';
import path from 'path';

describe('fs', function () {
  const buildManifest = require('../../dist/client/manifest.json');

  const generatedFiles = Object.values(buildManifest)
    .filter((e: any): e is any => Boolean(e.file))
    .map((e) => [e.file, ...(e.assets ?? []), ...(e.css ?? [])])
    .flat(1)
    .filter((f) => f.startsWith('assets/'));

  testFs(path.basename(__dirname), [
    '/server/pages/api/post.js',
    '/static/tests/common/index.html',
    '/functions-manifest.json',
    '/prerender-manifest.json',
    '/routes-manifest.json',
    '/static/manifest.json',
    '/static/vite-plugin-ssr.json',
    // ISR + Static pages
    '/server/pages/404.html',
    '/server/pages/api/ssr_.js',
    '/server/pages/index.html',
    '/server/pages/isr.html',
    '/server/pages/ssr_.js',
    '/server/pages/static.html',
    '/server/pages/catch-all/a/b/c.html',
    '/server/pages/catch-all/a/d.html',
    '/server/pages/function/a.html',
    '/server/pages/named/id-1.html',
    '/server/pages/named/id-2.html',
    ...generatedFiles.map((f) => '/static/' + f),
  ]);
});
