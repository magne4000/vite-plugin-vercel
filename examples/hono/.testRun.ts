export { testRun };

import { expect, fetch, getServerUrl, run, test } from "@brillout/test-e2e";

function testRun(cmd: `pnpm run ${"dev" | "prod"}`) {
  run(cmd, {
    serverUrl: "http://127.0.0.1:3000",
  });

  test("/", async () => {
    const html = await fetch(`${getServerUrl()}/`);
    expect(await html.text()).toContain("OK");
  });

  test("/hello", async () => {
    const html = await fetch(`${getServerUrl()}/hello`);
    expect(await html.text()).toContain("hello");
  });
}
