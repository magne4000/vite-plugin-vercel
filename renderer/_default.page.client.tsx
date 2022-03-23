import _ReactDOM from 'react-dom';
import ReactDOMType from 'react-dom/client';
import React from 'react';
import { useClientRouter } from 'vite-plugin-ssr/client/router';
import { PageWrapper } from './PageWrapper';
import type { PageContext } from './types';
import type { PageContextBuiltInClient } from 'vite-plugin-ssr/client/router';

const ReactDOM: typeof ReactDOMType = _ReactDOM as any;

let root: ReactDOMType.Root;
const { hydrationPromise } = useClientRouter({
  render(pageContext: PageContextBuiltInClient & PageContext) {
    const { Page, pageProps } = pageContext;
    const page = (
      <PageWrapper pageContext={pageContext}>
        <Page {...pageProps} />
      </PageWrapper>
    );
    const container = document.getElementById('page-view')!;
    if (pageContext.isHydration) {
      root = ReactDOM.hydrateRoot(container, page);
    } else {
      if (!root) {
        root = ReactDOM.createRoot(container);
      }
      root.render(page);
    }
  },
  onTransitionStart,
  onTransitionEnd,
});

hydrationPromise.then(() => {
  console.log('Hydration finished; page is now interactive.');
});

function onTransitionStart() {
  console.log('Page transition start');
  document.querySelector('#page-content')!.classList.add('page-transition');
}
function onTransitionEnd() {
  console.log('Page transition end');
  document.querySelector('#page-content')!.classList.remove('page-transition');
}
