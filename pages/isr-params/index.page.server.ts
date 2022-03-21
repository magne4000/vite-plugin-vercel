import { PageContextBuiltIn } from 'vite-plugin-ssr/types';

export function onBeforeRender(pageContext: PageContextBuiltIn) {
  return {
    pageContext: {
      pageProps: {
        d: String(new Date()),
        someId: pageContext.routeParams.someId,
      },
    },
  };
}

export async function prerender() {
  return ['/isr-params/id-1', '/isr-params/id-2'];
}
