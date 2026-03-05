import { expect } from "vitest";

expect.extend({
  toEqualUnordered<T>(received: T[], expected: T[]) {
    const missing = expected.filter(
      (expectedItem) =>
        !received.some((receivedItem) => {
          try {
            expect(receivedItem).toEqual(expectedItem);
            return true;
          } catch {
            return false;
          }
        }),
    );

    const extra = received.filter(
      (receivedItem) =>
        !expected.some((expectedItem) => {
          try {
            expect(receivedItem).toEqual(expectedItem);
            return true;
          } catch {
            return false;
          }
        }),
    );

    const pass = missing.length === 0 && extra.length === 0;

    return {
      pass,
      message: () => {
        const lines: string[] = [];
        if (missing.length) lines.push(`Missing elements:\n${JSON.stringify(missing, null, 2)}`);
        if (extra.length) lines.push(`Extra elements:\n${JSON.stringify(extra, null, 2)}`);
        return lines.join("\n\n");
      },
    };
  },
});

// Augment Vitest's matcher types
interface CustomMatchers<R = unknown> {
  toEqualUnordered<T>(expected: T[]): R;
}

declare module "vitest" {
  interface Matchers<T = any> extends CustomMatchers<T> {}
}
