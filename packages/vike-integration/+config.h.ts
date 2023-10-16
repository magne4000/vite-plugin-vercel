import type { Config } from 'vike/types';

export default {
  meta: {
    isr: {
      env: 'server-only',
    },
    // TODO
    // edge: {
    //   env: 'server-only',
    // },
    // headers: {
    //   env: 'server-only',
    // },
  },
} satisfies Config;
