import React from 'react';
import { createRoot, hydrateRoot, Root } from 'react-dom/client';
import type { PageContextBuiltInClient } from 'vite-plugin-ssr/client/router';
import { PageWrapper } from './PageWrapper';
import type { PageContext } from './types';

export const clientRouting = true;

let root: Root;
export async function render(
  pageContext: PageContextBuiltInClient & PageContext,
) {
  const { Page, pageProps } = pageContext;
  const page = (
    <PageWrapper pageContext={pageContext}>
      <Page {...pageProps} />
    </PageWrapper>
  );
  const container = document.getElementById('page-view')!;
  if (pageContext.isHydration) {
    root = hydrateRoot(container, page);
  } else {
    if (!root) {
      root = createRoot(container);
    }
    root.render(page);
  }
}

export function onTransitionStart() {
  console.log('Page transition start');
}

export function onTransitionEnd() {
  console.log('Page transition end');
}
