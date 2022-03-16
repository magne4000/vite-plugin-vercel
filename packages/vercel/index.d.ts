import { ViteVercelConfig } from './src/types';

export * from './dist';
export * from './src/types';
export * from './vercel';
export { default } from './dist';

declare module 'vite' {
  interface UserConfig {
    vercel?: ViteVercelConfig;
  }
}
