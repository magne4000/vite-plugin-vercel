import "../types";
import { enhance, type UniversalMiddleware } from "@universal-middleware/core";
import { getOriginalRequest } from "../utils/original-request";

export const overrideVercelRequest: UniversalMiddleware = (request) => {
  Object.assign(request, getOriginalRequest(request));
};

export default [
  enhance(overrideVercelRequest, {
    name: "vercel:request",
    immutable: true,
    order: Number.MIN_SAFE_INTEGER,
  }),
] as UniversalMiddleware[];
