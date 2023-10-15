import type { VercelRequest, VercelResponse } from '@vercel/node';

export const edge = true;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  return response.send('OK');
}
