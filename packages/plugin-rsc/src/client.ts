import type { CallServerCallback } from 'react-server-dom-webpack/client'
import * as ReactClient from 'react-server-dom-webpack/client.browser'

export function createFromReadableStream<T>(
  stream: ReadableStream<Uint8Array>,
  options: object = {},
): Promise<T> {
  return ReactClient.createFromReadableStream(stream, {
    callServer: (globalThis as any).__RSPACK_RSC_CALL_SERVER,
    findSourceMapURL,
    ...options,
  })
}

export function createFromFetch<T>(
  promiseForResponse: Promise<Response>,
  options: object = {},
): Promise<T> {
  return ReactClient.createFromFetch(promiseForResponse, {
    callServer: (globalThis as any).__RSPACK_RSC_CALL_SERVER,
    findSourceMapURL,
    ...options,
  })
}

export const encodeReply: (
  v: unknown[],
  options?: Parameters<typeof ReactClient.encodeReply>[1],
) => Promise<string | FormData> = ReactClient.encodeReply

export function setServerCallback(fn: CallServerCallback): void {
    (globalThis as any).__RSPACK_RSC_CALL_SERVER = fn
}

export const createTemporaryReferenceSet: () => unknown =
  ReactClient.createTemporaryReferenceSet

export function findSourceMapURL(
//   filename: string,
//   environmentName: string,
): string | null {
    return null
}
