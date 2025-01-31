import 'react-router';
import { createRequestHandler } from '@react-router/express';

declare module 'react-router' {
  interface AppLoadContext {
    VALUE_FROM_EXPRESS: string;
  }
}

export const app = createRequestHandler({
  // @ts-expect-error - virtual module provided by React Router at build time
  build: () => import('virtual/react-router/server-build'),
  getLoadContext() {
    return {
      VALUE_FROM_EXPRESS: 'Hello from Express',
    };
  },
});
