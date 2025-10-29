export { testRun };

import { expect, fetchHtml, run, test } from "@brillout/test-e2e";

function testRun(cmd: `pnpm run ${"dev" | "prod"}`) {
  run(cmd, {
    serverUrl: "http://127.0.0.1:3000",
  });

  test("/", async () => {
    const html = await fetchHtml("/");
    expect(html).toContain("<h1>/</h1>");
  });

  test("/edge", async () => {
    const html = await fetchHtml("/edge");
    expect(html).toContain("<h1>/edge</h1>");
  });

  test("/isr", async () => {
    const html = await fetchHtml("/isr");
    expect(html).toContain("<h1>/isr</h1>");
  });

  test("/headers", async () => {
    const html = await fetchHtml("/headers");
    expect(html).toContain("<h1>/headers</h1>");
  });
}
