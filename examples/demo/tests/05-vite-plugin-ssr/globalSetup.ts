import path from 'path';
import { setup as _setup } from '../common/setup';
import { teardown as _teardown } from '../common/teardown';
// @ts-ignore
import config from './vite.config.test';

export const setup = _setup(path.basename(__dirname), {
  // vite-plugin-ssr passes `configFile` to build subprocess.
  configFile: path.join(__dirname, './vite.config.test.js'),
  build: {
    ...config.build,
    ssr: false,
  },
});

export const teardown = _teardown(path.basename(__dirname));
