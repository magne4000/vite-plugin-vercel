import { PageContextBuiltIn } from 'vite-plugin-ssr/types';

export const doNotPrerender = true;

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

// export async function prerender() {
//   return ['/named/id-1', '/named/id-2'];
// }
