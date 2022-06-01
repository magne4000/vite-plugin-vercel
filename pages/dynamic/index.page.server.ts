export const doNotPrerender = true;

export function onBeforeRender() {
  return {
    pageContext: {
      pageProps: {
        d: String(new Date()),
      },
    },
  };
}
