import { prepareTestJsonFilesContent, testSchema } from '../helpers';
import { vercelOutputVcConfigSchema } from 'vite-plugin-vercel/src/schemas/config/vc-config';
import path from 'path';

prepareTestJsonFilesContent(
  path.basename(__dirname),
  [
    '/functions/api/page.func/.vc-config.json',
    '/functions/api/post.func/.vc-config.json',
    '/functions/index2.func/.vc-config.json',
    '/functions/index3.func/.vc-config.json',
  ],
  (context) => {
    testSchema(context, vercelOutputVcConfigSchema);

    it('should have only necessary properties', function () {
      expect(context.file).toStrictEqual({
        handler: 'index.js',
        launcherType: 'Nodejs',
        runtime: 'nodejs16.x',
        shouldAddHelpers: true,
      });
    });
  },
);
