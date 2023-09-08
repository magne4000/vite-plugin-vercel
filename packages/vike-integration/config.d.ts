import 'vite-plugin-ssr/types';

// When this is imported by a projet ->
//   import config from '@vite-plugin-vercel/vike/config'
// the following override is applied to the whole project
declare module 'vite-plugin-ssr/types' {
  export interface ConfigVikePackages {
    isr?: boolean | { expiration: number };
  }
}

// Help TS's resolver for node10 target
export * from './dist/+config.h';
