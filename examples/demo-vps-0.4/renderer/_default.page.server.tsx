import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { PageWrapper } from './PageWrapper';
import { escapeInject, dangerouslySkipEscape } from 'vike/server';
import logoUrl from './logo.svg';
import type { PageContext } from './types';
import type { PageContextBuiltInServer } from 'vike/types';

export { render };

// See https://vike.dev/data-fetching
export const passToClient = ['pageProps', 'urlPathname', 'documentProps'];

async function render(pageContext: PageContextBuiltInServer & PageContext) {
  const { Page, pageProps } = pageContext;
  const pageHtml = ReactDOMServer.renderToString(
    <PageWrapper pageContext={pageContext}>
      <Page {...pageProps} />
    </PageWrapper>,
  );

  // See https://vike.dev/html-head
  const { documentProps } = pageContext;
  const title = (documentProps && documentProps.title) || 'Vite SSR app';
  const desc =
    (documentProps && documentProps.description) || 'App using Vite + vike';

  const injected = escapeInject`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" href="${logoUrl}" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="${desc}" />
        <title>${title}</title>
      </head>
      <body>
        <div id="page-view">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`;

  return {
    documentHtml: injected,
    pageContext: {},
  };
}
