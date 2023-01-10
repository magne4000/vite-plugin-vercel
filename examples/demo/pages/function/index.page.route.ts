import { PageContextBuiltIn } from 'vite-plugin-ssr/types';

export default (pageContext: PageContextBuiltIn) => {
  if (!pageContext.urlOriginal.startsWith('/function/')) return false;
  return {
    precedence: -1,
  };
};
