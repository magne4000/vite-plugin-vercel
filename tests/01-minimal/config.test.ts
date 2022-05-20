import { vercelOutputConfigSchema } from 'vite-plugin-vercel/src/schemas/config/config';
import { prepareTestJsonFileContent, testSchema } from '../helpers';
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
      ]);
      expect(context.file).toHaveProperty('overrides', {});
      expect(Object.keys(context.file as any)).toEqual(
        expect.toIncludeSameMembers(['version', 'overrides', 'routes']),
      );
    });
  },
);
