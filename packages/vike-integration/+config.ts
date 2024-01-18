import type { Config } from 'vike/types';

export default {
  meta: {
    isr: {
      env: { server: true },
    },
    // TODO
    // edge: {
    //   env: { server: true },
    // },
    // headers: {
    //   env: { server: true },
    // },
  },
} satisfies Config;
