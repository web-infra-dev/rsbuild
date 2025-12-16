// @ts-ignore
import serverReferenceManifest from 'builtin:rsc-server-reference-manifest-loader!'
// @ts-ignore
import clientReferenceManifest from 'builtin:rsc-client-reference-manifest-loader!'
import * as ReactClient from 'react-server-dom-webpack/client'
import * as ReactServer from 'react-server-dom-webpack/server'

declare const __webpack_require__: (id: string | number) => any;

export async function loadServerAction(actionId: string): Promise<Function> {
  const actionModId = serverReferenceManifest[actionId]?.id;

  if (!actionModId) {
    throw new Error(
      `Failed to find Server Action "${actionId}". This request might be from an older or newer deployment.`
    )
  }

  const moduleExports = __webpack_require__(actionModId)
  return moduleExports[actionId]
}

export function renderToReadableStream(
  data: any,
  options?: Parameters<typeof ReactServer.renderToReadableStream>[2],
): ReadableStream<Uint8Array> {
  return ReactServer.renderToReadableStream(
    data,
    clientReferenceManifest.clientModules,
    options,
  )
}

export function createFromReadableStream<T>(
  stream: ReadableStream<Uint8Array>,
  options: Omit<ReactClient.Options, "serverConsumerManifest"> = {},
): Promise<T> {
  return ReactClient.createFromReadableStream(stream, {
    serverConsumerManifest: {
      // https://github.com/facebook/react/pull/31300
      // https://github.com/vercel/next.js/pull/71527
      moduleMap: clientReferenceManifest.ssrModuleMapping,
      moduleLoading: clientReferenceManifest.moduleLoading,
      serverModuleMap: null,
    },
    ...options,
  })
}

export function decodeReply(
  body: string | FormData,
  options: Parameters<typeof ReactServer.decodeReply>[2],
): Promise<unknown[]> {
  return ReactServer.decodeReply(body, serverReferenceManifest, options)
}

export function decodeAction(body: FormData): Promise<() => unknown> | null {
  return ReactServer.decodeAction(body, serverReferenceManifest)
}

export function decodeFormState(
  actionResult: unknown,
  body: FormData,
): Promise<ReactServer.ReactFormState | null> {
  return ReactServer.decodeFormState(actionResult, body, serverReferenceManifest)
}

export const createTemporaryReferenceSet: () => unknown =
  ReactServer.createTemporaryReferenceSet

export const encodeReply: (
  v: unknown[],
  options?: Parameters<typeof ReactClient.encodeReply>[1],
) => Promise<string | FormData> = ReactClient.encodeReply

export const createClientTemporaryReferenceSet: () => unknown =
  ReactClient.createTemporaryReferenceSet

