import { PageContextBuiltInServer } from 'vite-plugin-ssr/types';

export default function (pageContext: PageContextBuiltInServer) {
  if (!pageContext.urlPathname.startsWith('/function/')) return false;
  return {
    precedence: -1,
  };
}
