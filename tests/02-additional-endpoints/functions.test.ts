import {
  prepareTestJsonFileContent,
  testFileExists,
  testSchema,
} from '../helpers';
import { functionsManifestSchema } from 'vite-plugin-vercel/src/schemas/manifests/functions';

describe('functions-manifest.json - pre tests', function () {
  testFileExists('.output/functions-manifest.json');
});

prepareTestJsonFileContent('.output/functions-manifest.json', (context) => {
  testSchema(context, functionsManifestSchema);

  // TODO ssr/isr endpoint in further scenarii
  it('should have a unique SSR api function', function () {
    expect(context.file).toHaveProperty(['pages', 'api/post.js']);
  });
});
