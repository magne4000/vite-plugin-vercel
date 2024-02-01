import { testFs } from '../common/helpers';
import { describe } from 'vitest';
import path from 'path';

describe('fs', function () {
  testFs(path.basename(__dirname), [
    '/config.json',
    '/functions/api/name/[name].func/.vc-config.json',
    '/functions/api/name/[name].func/index.js',
    '/functions/api/page.func/index.js',
    '/functions/api/page.func/.vc-config.json',
    '/functions/api/post.func/index.js',
    '/functions/api/post.func/.vc-config.json',
    '/functions/edge.func/index.js',
    '/functions/edge.func/.vc-config.json',
    '/static/test.html',
    '/static/tests/common/index.html',
  ]);
});
