import { ViteVercelConfig } from './dist';

export * from './dist';
export { default } from './dist';

declare module 'vite' {
  export interface UserConfig {
    vercel?: ViteVercelConfig;
  }
}
