import { prepareTestJsonFileContent, testSchema } from '../helpers';
import { prerenderManifestSchema } from 'vite-plugin-vercel/src/schemas/manifests/prerender';

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
