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
            expiration: 15,
            srcRoute: '/ssr_',
          },
          '/catch-all/a/d': {
            dataRoute: '',
            expiration: 15,
            srcRoute: '/ssr_',
          },
          '/function/a': {
            dataRoute: '',
            expiration: 15,
            srcRoute: '/ssr_',
          },
          '/isr': {
            dataRoute: '',
            expiration: 15,
            srcRoute: '/ssr_',
          },
          '/named/id-1': {
            dataRoute: '',
            expiration: 25,
            srcRoute: '/ssr_',
          },
          '/named/id-2': {
            dataRoute: '',
            expiration: 25,
            srcRoute: '/ssr_',
          },
        },
        // dynamicRoutes: {
        //   '/ssr_': {
        //     routeRegex: '^/ssr_$',
        //     dataRoute: '',
        //     fallback: null,
        //     dataRouteRegex: '',
        //   },
        // },
        dynamicRoutes: {},
        preview: {
          previewModeId: null,
        },
      });
    });
  },
);
