import { testFs } from '../helpers';
import path from 'path';

describe('fs', function () {
  const buildManifest = require('../../dist/client/manifest.json');

  const generatedFiles = Object.values(buildManifest)
    .filter((e: any): e is any => Boolean(e.file))
    .map((e) => [e.file, ...(e.assets ?? []), ...(e.css ?? [])])
    .flat(1)
    .filter((f) => f.startsWith('assets/'));

  const expected = [
    '/config.json',
    '/functions/api/page.func/index.js',
    '/functions/api/page.func/.vc-config.json',
    '/functions/api/post.func/index.js',
    '/functions/api/post.func/.vc-config.json',
    '/static/vite-plugin-ssr.json',
    '/static/manifest.json',
    // ISR + Static pages
    '/functions/ssr_.func/index.js',
    '/functions/ssr_.func/.vc-config.json',
    '/static/404.html',
    '/static/index.html',
    '/static/static.html',
    '/static/catch-all/a/b/c.html',
    '/static/catch-all/a/d.html',
    '/static/function/a.html',
    '/static/named/id-1.html',
    '/static/named/id-2.html',
    '/static/tests/common/index.html',
    new RegExp('/functions/pages/catch-all-([^/]+?)\\.prerender-config\\.json'),
    new RegExp('/functions/pages/catch-all-([^/]+?)\\.func/index\\.js'),
    new RegExp(
      '/functions/pages/catch-all-([^/]+?)\\.func/\\.vc-config\\.json',
    ),
    new RegExp('/functions/pages/isr-([^/]+?)\\.prerender-config\\.json'),
    new RegExp('/functions/pages/isr-([^/]+?)\\.func/index\\.js'),
    new RegExp('/functions/pages/isr-([^/]+?)\\.func/\\.vc-config\\.json'),
    new RegExp('/functions/pages/named-([^/]+?)\\.prerender-config\\.json'),
    new RegExp('/functions/pages/named-([^/]+?)\\.func/index\\.js'),
    new RegExp('/functions/pages/named-([^/]+?)\\.func/\\.vc-config\\.json'),
    ...generatedFiles.map((f) => '/static/' + f),
  ];

  testFs(path.basename(__dirname), (entries) => {
    expect(entries).toSatisfyAll((elt: string) => {
      for (const exp of expected) {
        if (typeof exp === 'string') {
          if (exp === elt) return true;
        } else {
          const match = elt.match(exp);
          if (match) return true;
        }
      }
      console.error('no match found for', elt);
      return false;
    });
    expect(entries).toBeArrayOfSize(expected.length);
  });
});
