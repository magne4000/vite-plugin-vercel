import { Hono } from "hono";

const app = new Hono();

app.get("/hello", () => new Response("hello"));
app.get("/*", () => new Response("OK"));

export default app;
