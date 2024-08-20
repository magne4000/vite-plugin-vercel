import "vike/types";

// When this is imported by a projet ->
//   import config from '@vite-plugin-vercel/vike/config'
// the following override is applied to the whole project
declare global {
  namespace Vike {
    export interface Config {
      isr?: boolean | { expiration: number };
      edge?: boolean;
      headers?: Record<string, string>;
    }
  }
}

// Help TS's resolver for node10 target
export * from "./dist/+config.h";
