import { testFs } from '../helpers';

describe('fs', function () {
  testFs([
    '.output/server/pages/api/post.js',
    '.output/server/pages/post.js',
    '.output/server/pages/index2.js',
    '.output/server/pages/index3.js',
    '.output/server/pages/api/index3.js',
    '.output/server/pages/index4.js',
    '.output/static/tests/common/index.html',
    '.output/functions-manifest.json',
    '.output/prerender-manifest.json',
    '.output/routes-manifest.json',
  ]);
});
