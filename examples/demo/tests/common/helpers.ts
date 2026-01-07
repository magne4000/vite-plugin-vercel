import { expect, it } from "vitest";
import type { ZodSchema } from "zod/v4";

export interface TestContext {
  file: unknown;
}

export function testSchema<T>(context: TestContext, schema: ZodSchema<T>) {
  it("should respect schema", () => {
    expect(schema.safeParse(context.file)).not.toHaveProperty("error");
  });
}
