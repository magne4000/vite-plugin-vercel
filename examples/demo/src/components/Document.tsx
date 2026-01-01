import type { ReactNode } from "react";

export function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Vite + React + vite-plugin-vercel</title>
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
