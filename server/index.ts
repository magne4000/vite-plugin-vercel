/// <reference types="vite/client" />

import express from 'express';
import { createPageRenderer } from 'vite-plugin-ssr';
import * as vite from 'vite';

const root = `${__dirname}/..`;

startServer();

async function startServer() {
  if (process.env.PROD) {
    throw new Error('Not for production use');
  }

  const app = express();

  const viteDevServer = await vite.createServer({
    root,
    server: { middlewareMode: true },
  });

  app.use(viteDevServer.middlewares);

  const renderPage = createPageRenderer({
    viteDevServer,
    root,
    isProduction: false,
  });

  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    const pageContextInit = {
      url,
    };
    const pageContext = await renderPage(pageContextInit);
    const { httpResponse } = pageContext;
    if (!httpResponse) return next();
    const { statusCode, body } = httpResponse;
    res.status(statusCode).send(body);
  });

  process.on('uncaughtException', function (err) {
    console.error(err);
    if (
      err.message !== 'Cannot set headers after they are sent to the client'
    ) {
      process.exit(1);
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port);
}
