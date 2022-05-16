import { prepareTestJsonFileContent, testSchema } from '../helpers';
import { functionsManifestSchema } from 'vite-plugin-vercel/src/schemas/manifests/functions';
import path from 'path';

prepareTestJsonFileContent(
  path.basename(__dirname),
  '/functions-manifest.json',
  (context) => {
    testSchema(context, functionsManifestSchema);

    it('should have a unique SSR api function', function () {
      expect(context.file).toHaveProperty(['pages', 'api/post.js']);
    });
  },
);
