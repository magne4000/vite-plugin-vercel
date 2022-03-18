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
            initialRevalidateSeconds: 15,
            srcRoute: '/ssr_',
            dataRoute: '',
          },
        },
        dynamicRoutes: {
          '/ssr_': {
            routeRegex: '^/ssr_$',
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
