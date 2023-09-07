export function onBeforeRender() {
  return {
    pageContext: {
      pageProps: {
        d: String(new Date()),
      },
    },
  };
}

export async function prerender() {
  return ['/catch-all/a/b/c', '/catch-all/a/d'];
}
