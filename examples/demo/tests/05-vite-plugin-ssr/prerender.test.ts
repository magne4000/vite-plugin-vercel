import path from 'path';
import { expect, it } from 'vitest';
import { vercelOutputPrerenderConfigSchema } from '../../../../packages/vercel/src/schemas/config/prerender-config';
import { prepareTestJsonFileContent, testSchema } from '../common/helpers';

prepareTestJsonFileContent(
  path.basename(__dirname),
  '/functions/pages/catch-all-*.prerender-config.json',
  (context) => {
    testSchema(context, vercelOutputPrerenderConfigSchema);

    it('should have only necessary properties', function () {
      expect(Object.keys(context.file as any)).toHaveLength(2);
      expect(context.file).toHaveProperty('expiration', 15);
      expect(context.file).toHaveProperty('group');
      expect((context.file as any).group).toBeTypeOf('number');
    });
  },
);

prepareTestJsonFileContent(
  path.basename(__dirname),
  '/functions/pages/isr-*.prerender-config.json',
  (context) => {
    testSchema(context, vercelOutputPrerenderConfigSchema);

    it('should have only necessary properties', function () {
      expect(Object.keys(context.file as any)).toHaveLength(2);
      expect(context.file).toHaveProperty('expiration', 15);
      expect(context.file).toHaveProperty('group');
      expect((context.file as any).group).toBeTypeOf('number');
    });
  },
);

prepareTestJsonFileContent(
  path.basename(__dirname),
  '/functions/pages/named-*.prerender-config.json',
  (context) => {
    testSchema(context, vercelOutputPrerenderConfigSchema);

    it('should have only necessary properties', function () {
      expect(Object.keys(context.file as any)).toHaveLength(2);
      expect(context.file).toHaveProperty('expiration', 25);
      expect(context.file).toHaveProperty('group');
      expect((context.file as any).group).toBeTypeOf('number');
    });
  },
);
