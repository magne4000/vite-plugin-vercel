import { get } from '@vercel/edge-config';

export default async function handler() {
  await get('someKey');

  return new Response('Edge Function: OK', {
    status: 200,
  });
}
