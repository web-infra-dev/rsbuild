// @ts-ignore
import clientReferenceManifest from 'builtin:rsc-client-reference-manifest-loader!'
import * as ReactClient from 'react-server-dom-webpack/client'

export function createFromReadableStream<T>(
  stream: ReadableStream<Uint8Array>,
  options: Omit<Parameters<typeof ReactClient.createFromReadableStream>[1], "serverConsumerManifest"> = {},
): Promise<T> {
  return ReactClient.createFromReadableStream(stream, {
    serverConsumerManifest: {
        moduleMap: clientReferenceManifest.ssrModuleMapping,
        moduleLoading: clientReferenceManifest.moduleLoading,
        serverModuleMap: null,
    },
    ...options,
  })
}

export const callServer = null
export const findSourceMapURL = null
