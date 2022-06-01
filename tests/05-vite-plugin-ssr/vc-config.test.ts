import path from 'path';
import { expect, it } from 'vitest';
import { vercelOutputVcConfigSchema } from '../../../../packages/vercel/src/schemas/config/vc-config';
import { prepareTestJsonFilesContent, testSchema } from '../common/helpers';

prepareTestJsonFilesContent(
  path.basename(__dirname),
  [
    '/functions/api/page.func/.vc-config.json',
    '/functions/api/post.func/.vc-config.json',
    '/functions/ssr_.func/.vc-config.json',
    '/functions/pages/catch-all-*.func/.vc-config.json',
    '/functions/pages/isr-*.func/.vc-config.json',
    '/functions/pages/named-*.func/.vc-config.json',
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
