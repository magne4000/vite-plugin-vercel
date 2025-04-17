import { Hono } from "hono";
import { apply, serve } from "@photonjs/core/hono";

const app = new Hono();

// FIXME catch-all is called by apply, so further registered routes are not taken into account
apply(app);

app.get("/hello", () => new Response("hello"));

app.get("/*", () => new Response("OK"));

export default serve(app, {});
