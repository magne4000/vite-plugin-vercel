import handler from "vike-server/universal-middlewares";
import { getOriginalRequest } from "vite-plugin-vercel/utils";
import { pipeRoute, type RuntimeAdapter } from "@universal-middleware/core";

export default function vercelVikeHandler(request: Request, context: Universal.Context, runtime: RuntimeAdapter) {
  const middlewares = handler(/* TODO */);
  return pipeRoute(middlewares)(getOriginalRequest(request), context, runtime);
}
