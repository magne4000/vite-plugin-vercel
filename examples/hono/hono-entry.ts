import { createHandler } from "@universal-middleware/hono";
import { Hono } from "hono";
import type { UniversalHandler } from "@universal-middleware/core";

const app = new Hono();

app.get(
  "/hello",
  createHandler(() => () => {
    return new Response("hello");
  })(),
);

app.get(
  "/*",
  createHandler(() => () => {
    return new Response("OK");
  })(),
);

// All entries MUST be respect UniversalHandler interface
export default ((request: Request) => {
  return app.fetch(request, {});
}) satisfies UniversalHandler;
