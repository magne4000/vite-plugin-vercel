import {
  prepareTestJsonFileContent,
  testFileExists,
  testSchema,
} from '../helpers';
import { prerenderManifestSchema } from 'vite-plugin-vercel/src/schemas/manifests/prerender';

describe('prerender-manifest.json - pre tests', function () {
  testFileExists('.output/prerender-manifest.json');
});

prepareTestJsonFileContent('.output/prerender-manifest.json', (context) => {
  testSchema(context, prerenderManifestSchema);

  it('should have only required default properties', function () {
    expect(context.file).toStrictEqual({
      version: 3,
      routes: {},
      dynamicRoutes: {},
      preview: {
        previewModeId: null,
      },
    });
  });
});
