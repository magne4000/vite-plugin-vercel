// https://vite-plugin-ssr.com/onBeforeRender
export default function onBeforeRender() {
  return {
    pageContext: {
      pageProps: {
        d: String(new Date()),
      },
    },
  };
}
