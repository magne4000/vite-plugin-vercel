// https://vite-plugin-ssr.com/onRenderHtml
export default onRenderHtml;

import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { escapeInject } from 'vite-plugin-ssr/server';
import { PageShell } from './PageShell';
import { getPageTitle } from './getPageTitle';
import type { PageContextServer } from './types';

async function onRenderHtml(pageContext: PageContextServer) {
  const { Page, pageProps } = pageContext;

  const stream = ReactDOMServer.renderToString(
    <PageShell pageContext={pageContext}>
      <Page {...pageProps} />
    </PageShell>,
  );

  const title = getPageTitle(pageContext);

  const documentHtml = escapeInject`<!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
      </head>
      <body>
        <div id="page-view">${stream}</div>
      </body>
    </html>`;

  return {
    documentHtml,
    // See https://vite-plugin-ssr.com/stream#initial-data-after-stream-end
    pageContext: async () => {
      return {
        someAsyncProps: 42,
      };
    },
  };
}
