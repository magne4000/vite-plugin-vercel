/// <reference types="vite/client" />

import express from 'express';
import { renderPage } from 'vite-plugin-ssr/server';
import * as vite from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

  app.get('*', async (req, res, next) => {
    const urlOriginal = req.originalUrl;
    const pageContextInit = {
      urlOriginal,
    };
    const pageContext = await renderPage(pageContextInit);
    const { httpResponse } = pageContext;
    if (!httpResponse) return next();
    const { statusCode, body, contentType } = httpResponse;
    res.setHeader('Content-Type', contentType);
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
