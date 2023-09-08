import path from 'path';
import glob from 'fast-glob';
import { describe, expect, it } from 'vitest';

describe('fs', function () {
  const buildManifest = require('../../dist/client/manifest.json');

  const generatedFiles = Array.from(
    new Set(
      Object.values(buildManifest)
        .filter((e: any): e is any => Boolean(e.file))
        .map((e) => [e.file, ...(e.assets ?? []), ...(e.css ?? [])])
        .flat(1)
        .filter((f) => f.startsWith('assets/')),
    ),
  );

  const expected = [
    '/config.json',
    '/functions/api/page.func/index.js',
    '/functions/api/page.func/.vc-config.json',
    '/functions/api/post.func/index.js',
    '/functions/api/post.func/.vc-config.json',
    '/functions/edge.func/index.js',
    '/functions/edge.func/.vc-config.json',
    '/static/vite-plugin-ssr.json',
    '/static/manifest.json',
    // ISR + Static pages
    '/functions/ssr_.func/index.js',
    '/functions/ssr_.func/.vc-config.json',
    '/static/index.html',
    '/static/index.pageContext.json',
    '/static/static/index.html',
    '/static/static/index.pageContext.json',
    '/static/catch-all/a/b/c/index.html',
    '/static/catch-all/a/b/c/index.pageContext.json',
    '/static/catch-all/a/d/index.html',
    '/static/catch-all/a/d/index.pageContext.json',
    '/static/function/a/index.html',
    '/static/function/a/index.pageContext.json',
    '/static/named/id-1/index.html',
    '/static/named/id-1/index.pageContext.json',
    '/static/named/id-2/index.html',
    '/static/named/id-2/index.pageContext.json',
    '/static/test.html',
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

  it(`should generate the right files`, async function () {
    const dir = path.join(__dirname, '../../.vercel/output');
    const entries = await glob(dir + '/**', { dot: true });
    let mappedEntries = entries
      .map((e) => e.replace(dir, ''))
      .filter((e) => !e.startsWith('/_ignore'));

    mappedEntries = Array.from(new Set(mappedEntries));

    expect(entries).toHaveLength(expected.length);
    mappedEntries.forEach((entry) => {
      expect(entry).toSatisfy((elt: string) => {
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
    });
  });
});
