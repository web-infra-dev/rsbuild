import { createRequestHandler } from 'react-router';

declare global {
  interface CloudflareEnvironment extends Env {}
  interface ImportMeta {
    env: {
      MODE: string;
    };
  }
}

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: CloudflareEnvironment;
      ctx: ExecutionContext;
    };
  }
}
// @ts-expect-error - virtual module provided by React Router at build time
import * as serverBuild from 'virtual/react-router/server-build';

const requestHandler = createRequestHandler(serverBuild, import.meta.env.MODE);

export default {
  fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<CloudflareEnvironment>;
