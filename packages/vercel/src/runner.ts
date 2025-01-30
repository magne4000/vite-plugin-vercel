import { createServerHotChannel } from "vite";
import { ESModulesEvaluator, ModuleRunner } from "vite/module-runner";

export async function initRunner() {
  const transport = createServerHotChannel();

  const runner = new ModuleRunner(
    {
      root: process.cwd(),
      transport,
    },
    new ESModulesEvaluator(),
  );

  return { runner, transport };
}
