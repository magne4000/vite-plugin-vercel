export const isr = {
  expiration: 10,
};

export default {
  fetch(_request: Request) {
    return new Response(String(new Date()));
  },
};
