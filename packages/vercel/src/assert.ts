// @ts-ignore
import { newError } from "@brillout/libassert";

const libName = "vite-plugin-vercel";

export function assert(condition: unknown, errorMessage: string): asserts condition {
  if (condition) {
    return;
  }

  const err = newError(`[${libName}][Wrong Usage] ${errorMessage}`, 2);
  throw err;
}
