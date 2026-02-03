export const headers = {
  "X-VitePluginVercel-Test": "test",
};

export default {
  fetch(_request: Request) {
    return new Response("OK");
  },
};
