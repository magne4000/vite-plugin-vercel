export const isr = {
  expiration: 30,
};

// This is a Universal Handler
// See https://universal-middleware.dev/definitions#handler
export default async function handler(request: Request) {
  return new Response("ISR");
}
