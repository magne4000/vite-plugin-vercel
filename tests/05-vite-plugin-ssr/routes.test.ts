import { routesManifestSchema } from 'vite-plugin-vercel/src/schemas/manifests/routes';
import { prepareTestJsonFileContent, testSchema } from '../helpers';
import path from 'path';

prepareTestJsonFileContent(
  path.basename(__dirname),
  '/routes-manifest.json',
  (context) => {
    testSchema(context, routesManifestSchema);

    it('should have no rewrites, headers, redirects, or dynamicRoutes', function () {
      expect(context.file).toHaveProperty('rewrites', [
        { destination: '/api/ssr_', regex: '^/dynamic.*$', source: '/dynamic' },
      ]);
      expect(context.file).toHaveProperty('dynamicRoutes', [
        { page: '/api/ssr_', regex: '^/catch-all/(.+?)(?:/)?$' },
        { page: '/api/ssr_', regex: '^/named/([^/]+?)(?:/)?$' },
        { page: '/api/ssr_', regex: '^/((?!assets/)(?!api/).*)$' },
      ]);
      expect(context.file).not.toHaveProperty('headers');
      expect(context.file).not.toHaveProperty('redirects');
    });
  },
);
