import { ViteVercelConfig } from './src/types';

export * from './dist';
export * from './src/types';
export { default } from './dist';

declare module 'vite' {
  interface UserConfig {
    vercel?: ViteVercelConfig;
  }
}
