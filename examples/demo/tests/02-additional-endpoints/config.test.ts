import { vercelOutputConfigSchema } from '../../../../packages/vercel/src/schemas/config/config';
import { prepareTestJsonFileContent, testSchema } from '../common/helpers';
import { expect, it } from 'vitest';

import path from 'path';

prepareTestJsonFileContent(
  path.basename(__dirname),
  'config.json',
  (context) => {
    testSchema(context, vercelOutputConfigSchema);

    it('should have defaults routes only', function () {
      expect(context.file).toHaveProperty('routes', [
        {
          headers: { Location: '/$1' },
          src: '^/(?:(.+)/)?index(?:\\.html)?/?$',
          status: 308,
        },
        {
          headers: { Location: '/$1' },
          src: '^/(.*)\\.html/?$',
          status: 308,
        },
        { handle: 'filesystem' },
        {
          check: true,
          src: '^/index2(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?$',
          dest: '/index2/$1',
        },
        {
          check: true,
          src: '^/index3(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?$',
          dest: '/index3/$1',
        },
        {
          check: true,
          src: '^/api/page$',
          dest: '/api/page',
        },
        {
          check: true,
          src: '^/api/post$',
          dest: '/api/post',
        },
      ]);
      expect(context.file).toHaveProperty('overrides', {
        'test.html': {
          path: 'test',
        },
        'tests/common/index.html': {
          path: 'tests/common/index',
        },
      });
      expect(Object.keys(context.file as any).sort()).toEqual(
        ['version', 'overrides', 'routes'].sort(),
      );
    });
  },
);
