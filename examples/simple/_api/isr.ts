export const isr = { expiration: 10 };

export default async function handler(request: Request) {
  return new Response("ISR");
}
