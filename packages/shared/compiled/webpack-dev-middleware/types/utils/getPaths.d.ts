/// <reference types="node" />
export = getPaths;
/** @typedef {import('../webpack').Compiler} Compiler */
/** @typedef {import('../webpack').Stats} Stats */
/** @typedef {import('../webpack').MultiStats} MultiStats */
/** @typedef {import('../index').IncomingMessage} IncomingMessage */
/** @typedef {import('../index').ServerResponse} ServerResponse */
/**
 * @template {IncomingMessage} Request
 * @template {ServerResponse} Response
 * @param {import('../index').Context<Request, Response>} context
 */
declare function getPaths<
  Request extends import('http').IncomingMessage,
  Response extends import('../index').ServerResponse,
>(
  context: import('../index').Context<Request, Response>,
): {
  outputPath: string;
  publicPath: string;
}[];
declare namespace getPaths {
  export { Compiler, Stats, MultiStats, IncomingMessage, ServerResponse };
}
type Compiler = import('../webpack').Compiler;
type Stats = import('../webpack').Stats;
type MultiStats = import('../webpack').MultiStats;
type IncomingMessage = import('../index').IncomingMessage;
type ServerResponse = import('../index').ServerResponse;
