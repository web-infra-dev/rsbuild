/// <reference types="node" />
export = getFilenameFromUrl;
/**
 * @template {IncomingMessage} Request
 * @template {ServerResponse} Response
 * @param {import('../index').FilledContext<Request, Response>} context
 * @param {string} url
 * @param {Extra=} extra
 * @returns {string | undefined}
 */
declare function getFilenameFromUrl<
  Request extends import('http').IncomingMessage,
  Response extends import('../index').ServerResponse,
>(
  context: import('../index').FilledContext<Request, Response>,
  url: string,
  extra?: Extra | undefined,
): string | undefined;
declare namespace getFilenameFromUrl {
  export { Extra, IncomingMessage, ServerResponse };
}
type Extra = {
  stats?: import('fs').Stats | undefined;
  errorCode?: number | undefined;
};
type IncomingMessage = import('../index').IncomingMessage;
type ServerResponse = import('../index').ServerResponse;
