import { prepareTestJsonFileContent, testSchema } from '../helpers';
import { prerenderManifestSchema } from 'vite-plugin-vercel/src/schemas/manifests/prerender';
import path from 'path';

prepareTestJsonFileContent(
  path.basename(__dirname),
  '/prerender-manifest.json',
  (context) => {
    testSchema(context, prerenderManifestSchema);

    it('should have only required default properties', function () {
      expect(context.file).toStrictEqual({
        version: 3,
        routes: {
          '/isr': {
            initialRevalidateSeconds: 42,
            srcRoute: 'isr',
            dataRoute: 'something',
          },
        },
        dynamicRoutes: {
          isr: {
            routeRegex: '^isr$',
            dataRoute: '',
            fallback: null,
            dataRouteRegex: '',
          },
        },
        preview: {
          previewModeId: null,
        },
      });
    });
  },
);
