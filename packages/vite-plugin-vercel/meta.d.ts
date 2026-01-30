import type { VercelEntryOptions } from "./src/types";

declare module "@universal-deploy/store" {
  export interface EntryMeta {
    vercel?: VercelEntryOptions;
  }
}
