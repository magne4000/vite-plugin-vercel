import { testFs } from '../helpers';
import path from 'path';

describe('fs', function () {
  testFs(path.basename(__dirname), [
    '/server/pages/api/post.js',
    '/server/pages/post.js',
    '/server/pages/index2.js',
    '/server/pages/index3.js',
    '/server/pages/api/index3.js',
    '/server/pages/index4.js',
    '/static/tests/common/index.html',
    '/functions-manifest.json',
    '/prerender-manifest.json',
    '/routes-manifest.json',
  ]);
});
