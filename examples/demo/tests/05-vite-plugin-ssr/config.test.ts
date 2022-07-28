import path from 'path';
import { expect, it } from 'vitest';
import { vercelOutputConfigSchema } from '../../../../packages/vercel/src/schemas/config/config';
import { prepareTestJsonFileContent, testSchema } from '../common/helpers';

prepareTestJsonFileContent(
  path.basename(__dirname),
  'config.json',
  (context) => {
    testSchema(context, vercelOutputConfigSchema);

    it('should have defaults routes only', function () {
      expect((context.file as any).routes).toMatchObject([
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
          src: '^/api/page$',
          dest: '/api/page',
        },
        {
          check: true,
          src: '^/api/post$',
          dest: '/api/post',
        },
        {
          check: true,
          dest: expect.stringMatching(
            '/pages/catch-all-([^/]+?)/\\?__original_path=\\$1',
          ),
          src: '^(/catch-all/.+?(?:\\.pageContext\\.json)?)$',
        },
        {
          check: true,
          dest: expect.stringMatching(
            '/pages/isr-([^/]+?)/\\?__original_path=\\$1',
          ),
          src: '^(/isr(?:\\.pageContext\\.json)?)$',
        },
        {
          check: true,
          dest: expect.stringMatching(
            '/pages/named-([^/]+?)/\\?__original_path=\\$1',
          ),
          src: '^(/named/[^/]+(?:\\.pageContext\\.json)?)$',
        },
        { dest: '/ssr_/?__original_path=$1', src: '^((?!/api).*)$' },
      ]);
      expect((context.file as any).overrides).toMatchObject({
        'test.html': {
          path: 'test',
        },
        '404.html': {
          path: '404',
        },
        'catch-all/a/b/c.html': {
          path: 'catch-all/a/b/c',
        },
        'catch-all/a/d.html': {
          path: 'catch-all/a/d',
        },
        'function/a.html': {
          path: 'function/a',
        },
        'index.html': {
          path: '',
        },
        'named/id-1.html': {
          path: 'named/id-1',
        },
        'named/id-2.html': {
          path: 'named/id-2',
        },
        'static.html': {
          path: 'static',
        },
      });
      expect(Object.keys(context.file as any).sort()).toEqual(
        ['version', 'overrides', 'routes'].sort(),
      );
    });
  },
);
