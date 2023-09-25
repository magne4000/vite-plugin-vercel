import { PageContextBuiltInServer } from 'vike/types';

export default (pageContext: PageContextBuiltInServer) => {
  if (!pageContext.urlOriginal.startsWith('/function/')) return false;
  return {
    precedence: -1,
  };
};
