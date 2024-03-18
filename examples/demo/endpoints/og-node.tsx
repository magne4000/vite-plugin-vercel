import React from 'react';
import { ImageResponse } from '@vercel/og';

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const resp = new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          color: 'black',
          background: 'white',
          width: '100%',
          height: '100%',
          padding: '50px 200px',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        👋 Hello
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );

  Readable.fromWeb(resp.body as ReadableStream<any>).pipe(response);
}
