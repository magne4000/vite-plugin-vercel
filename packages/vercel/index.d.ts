import { ViteVercelConfig } from './dist';

export * from './dist';
export { default } from './dist';

declare module 'vite' {
  interface UserConfig {
    vercel?: ViteVercelConfig;
  }
}
