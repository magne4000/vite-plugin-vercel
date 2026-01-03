export function assert(condition: unknown, errorMessage: string): asserts condition {
  if (condition) {
    return;
  }

  throw new Error(`[vite-plugin-vercel] ${errorMessage}`);
}
