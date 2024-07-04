import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { vikeHandler } from './server/vike-handler';
import { createMiddleware } from '@universal-middleware/express';
import express from 'express';

const __filename = globalThis.__filename ?? fileURLToPath(import.meta.url);
const __dirname = globalThis.__dirname ?? dirname(__filename);
const root = __dirname;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const hmrPort = process.env.HMR_PORT
  ? parseInt(process.env.HMR_PORT, 10)
  : 24678;

interface Middleware<
  Context extends Record<string | number | symbol, unknown>,
> {
  (
    request: Request,
    context: Context,
  ): Response | void | Promise<Response> | Promise<void>;
}

export function handlerAdapter<
  Context extends Record<string | number | symbol, unknown>,
>(handler: Middleware<Context>) {
  return createMiddleware(
    async (context) => {
      const rawRequest = context.platform.request as unknown as Record<
        string,
        unknown
      >;
      rawRequest.context ??= {};
      const response = await handler(
        context.request,
        rawRequest.context as Context,
      );

      if (!response) {
        context.passThrough();
        return new Response('', {
          status: 404,
        });
      }

      return response;
    },
    {
      alwaysCallNext: false,
    },
  );
}

export default await startServer();

async function startServer() {
  const app = express();

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(`${root}/dist/client`));
  } else {
    // Instantiate Vite's development server and integrate its middleware to our server.
    // ⚠️ We should instantiate it *only* in development. (It isn't needed in production
    // and would unnecessarily bloat our server in production.)
    const vite = await import('vite');
    const viteDevMiddleware = (
      await vite.createServer({
        root,
        server: { middlewareMode: true, hmr: { port: hmrPort } },
      })
    ).middlewares;
    app.use(viteDevMiddleware);
  }

  app.get(
    '/hello',
    handlerAdapter(() => {
      console.log('HELLO');
      return new Response('Hello');
    }),
  );

  /**
   * Vike route
   *
   * @link {@see https://vike.dev}
   **/
  app.all('*', handlerAdapter(vikeHandler));

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });

  return app;
}
