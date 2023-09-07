import { PageContextBuiltInServer } from 'vite-plugin-ssr/types';

export function onBeforeRender(pageContext: PageContextBuiltInServer) {
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
  return ['/named/id-1', '/named/id-2'];
}
