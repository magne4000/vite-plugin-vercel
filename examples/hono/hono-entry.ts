import { apply, serve } from "@photonjs/hono";
import { Hono } from "hono";

const app = new Hono();

apply(app);
app.get("/hello", () => new Response("hello"));
app.get("/*", () => new Response("OK"));

export default serve(app, {});
