import { prepareTestJsonFileContent, testSchema } from '../helpers';
import { vercelOutputPrerenderConfigSchema } from 'vite-plugin-vercel/src/schemas/config/prerender-config';
import path from 'path';

prepareTestJsonFileContent(
  path.basename(__dirname),
  '/functions/pages/catch-all-*.prerender-config.json',
  (context) => {
    testSchema(context, vercelOutputPrerenderConfigSchema);

    it('should have only necessary properties', function () {
      expect(context.file).toStrictEqual({
        expiration: 15,
        group: expect.toBeNumber(),
      });
    });
  },
);

prepareTestJsonFileContent(
  path.basename(__dirname),
  '/functions/pages/isr-*.prerender-config.json',
  (context) => {
    testSchema(context, vercelOutputPrerenderConfigSchema);

    it('should have only necessary properties', function () {
      expect(context.file).toStrictEqual({
        expiration: 15,
        group: expect.toBeNumber(),
      });
    });
  },
);

prepareTestJsonFileContent(
  path.basename(__dirname),
  '/functions/pages/named-*.prerender-config.json',
  (context) => {
    testSchema(context, vercelOutputPrerenderConfigSchema);

    it('should have only necessary properties', function () {
      expect(context.file).toStrictEqual({
        expiration: 25,
        group: expect.toBeNumber(),
      });
    });
  },
);
