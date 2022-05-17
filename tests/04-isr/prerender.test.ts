import { prepareTestJsonFileContent, testSchema } from '../helpers';
import { vercelOutputPrerenderConfigSchema } from 'vite-plugin-vercel/src/schemas/config/prerender-config';
import path from 'path';

prepareTestJsonFileContent(
  path.basename(__dirname),
  '/functions/page1.prerender-config.json',
  (context) => {
    testSchema(context, vercelOutputPrerenderConfigSchema);

    it('should have only necessary properties', function () {
      expect(context.file).toStrictEqual({
        expiration: 42,
        group: 1,
      });
    });
  },
);
