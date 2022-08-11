export default async function handler() {
  return new Response('Edge Function: OK', {
    status: 200,
  });
}
