import { testFs } from '../helpers';

describe('fs', function () {
  testFs([
    '.output/server/pages/api/post.js',
    '.output/static/tests/common/index.html',
    '.output/functions-manifest.json',
    '.output/prerender-manifest.json',
    '.output/routes-manifest.json',
  ]);
});
