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
          '/catch-all/a/b/c': {
            dataRoute: '',
            initialRevalidateSeconds: 15,
            srcRoute: '/ssr_',
          },
          '/catch-all/a/d': {
            dataRoute: '',
            initialRevalidateSeconds: 15,
            srcRoute: '/ssr_',
          },
          '/function/a': {
            dataRoute: '',
            initialRevalidateSeconds: 15,
            srcRoute: '/ssr_',
          },
          '/isr': {
            dataRoute: '',
            initialRevalidateSeconds: 15,
            srcRoute: '/ssr_',
          },
          '/named/id-1': {
            dataRoute: '',
            initialRevalidateSeconds: 25,
            srcRoute: '/ssr_',
          },
          '/named/id-2': {
            dataRoute: '',
            initialRevalidateSeconds: 25,
            srcRoute: '/ssr_',
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
