import path from 'path';
import { vercelOutputConfigSchema } from '../../../../packages/vercel/src/schemas/config/config';
import { expect, it } from 'vitest';
import { prepareTestJsonFileContent, testSchema } from '../common/helpers';

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
          src: '^/edge(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?$',
          dest: '/edge/$1',
          check: true,
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
      expect(Object.keys(context.file as any).sort()).toMatchObject(
        ['version', 'overrides', 'routes'].sort(),
      );
    });
  },
);
