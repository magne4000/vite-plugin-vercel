import { PageContextBuiltInServer } from 'vite-plugin-ssr/types';

export default (pageContext: PageContextBuiltInServer) => {
  if (!pageContext.urlOriginal.startsWith('/function/')) return false;
  return {
    precedence: -1,
  };
};
