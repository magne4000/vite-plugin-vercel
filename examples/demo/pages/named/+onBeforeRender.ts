import { PageContextBuiltInServer } from 'vite-plugin-ssr/types';

// https://vite-plugin-ssr.com/onBeforeRender
export default function onBeforeRender(pageContext: PageContextBuiltInServer) {
  return {
    pageContext: {
      pageProps: {
        d: String(new Date()),
        someId: pageContext.routeParams.someId,
      },
    },
  };
}
