import { testFs } from '../helpers';
import path from 'path';

describe('fs', function () {
  testFs(path.basename(__dirname), [
    '/server/pages/api/post.js',
    '/static/tests/common/index.html',
    '/functions-manifest.json',
    '/prerender-manifest.json',
    '/routes-manifest.json',
  ]);
});
