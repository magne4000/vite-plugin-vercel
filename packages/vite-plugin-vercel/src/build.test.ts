import { NodeVersion } from "@vercel/build-utils";
import { describe, expect, it } from "vitest";
import { getVcConfig } from "./build";

describe("getVcConfig", () => {
  it("adds queue triggers to serverless functions", () => {
    expect(
      getVcConfig({}, "index.mjs", {
        edge: false,
        nodeVersion: new NodeVersion({
          major: 20,
          range: "20.x",
          runtime: "nodejs20.x",
        }),
        experimentalTriggers: [
          {
            type: "queue/v2beta",
            topic: "orders",
            consumer: "orders-consumer",
            initialDelaySeconds: 0,
            maxConcurrency: 2,
            maxDeliveries: 5,
            retryAfterSeconds: 60,
          },
        ],
      }),
    ).toMatchObject({
      experimentalTriggers: [
        {
          type: "queue/v2beta",
          topic: "orders",
          consumer: "orders-consumer",
          initialDelaySeconds: 0,
          maxConcurrency: 2,
          maxDeliveries: 5,
          retryAfterSeconds: 60,
        },
      ],
    });
  });

  it("accepts queue triggers without consumers", () => {
    expect(
      getVcConfig({}, "index.mjs", {
        edge: false,
        nodeVersion: new NodeVersion({
          major: 20,
          range: "20.x",
          runtime: "nodejs20.x",
        }),
        experimentalTriggers: [
          {
            type: "queue/v2beta",
            topic: "orders",
          },
        ],
      }),
    ).toMatchObject({
      experimentalTriggers: [
        {
          type: "queue/v2beta",
          topic: "orders",
        },
      ],
    });
  });

  it("preserves future queue trigger fields", () => {
    expect(
      getVcConfig({}, "index.mjs", {
        edge: false,
        nodeVersion: new NodeVersion({
          major: 20,
          range: "20.x",
          runtime: "nodejs20.x",
        }),
        experimentalTriggers: [
          {
            type: "queue/v2beta",
            topic: "orders",
            consumer: "orders-consumer",
            futureOption: true,
          },
        ],
      }),
    ).toMatchObject({
      experimentalTriggers: [
        {
          type: "queue/v2beta",
          topic: "orders",
          consumer: "orders-consumer",
          futureOption: true,
        },
      ],
    });
  });
});
