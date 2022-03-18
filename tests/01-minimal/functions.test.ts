import { prepareTestJsonFileContent, testSchema } from '../helpers';
import { functionsManifestSchema } from 'vite-plugin-vercel/src/schemas/manifests/functions';

prepareTestJsonFileContent('.output/functions-manifest.json', (context) => {
  testSchema(context, functionsManifestSchema);

  it('should have a unique api function', function () {
    expect(context.file).toHaveProperty(['pages', 'api/post.js']);
  });
});
