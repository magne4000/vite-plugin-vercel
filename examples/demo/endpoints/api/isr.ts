export const isr = {
  expiration: 10,
};

// This is a Universal Handler
// See https://universal-middleware.dev/definitions#handler
export default async function handler(_request: Request) {
  return new Response(String(new Date()));
}
