export const isr = { expiration: 10 };

export default function handler() {
  return new Response("ISR");
}
