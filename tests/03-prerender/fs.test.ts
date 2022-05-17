import { testFs } from '../helpers';
import path from 'path';

describe('fs', function () {
  testFs(path.basename(__dirname), [
    '/config.json',
    '/functions/api/page.func/index.js',
    '/functions/api/page.func/.vc-config.json',
    '/functions/api/post.func/index.js',
    '/functions/api/post.func/.vc-config.json',
    '/static/tests/common/index.html',
  ]);
});
