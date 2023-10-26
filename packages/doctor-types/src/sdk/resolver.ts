import { ProcessData } from './process';

export interface ResolveStackData {
  /** Step name */
  name: string;
  /** trying to resolve path */
  path: string;
  /** Request parameters */
  request?: string;
  /** Request path parameter */
  query?: string;
  /** Request fragment connection */
  fragment?: string;

  /** Whether to request a module */
  module?: boolean;

  /** Whether to request a module */
  file?: boolean;

  /** Whether to request a folder */
  directory?: boolean;

  /** Whether to request internal module */
  internal?: boolean;
}

export interface PathResolverBaseData extends ProcessData {
  /** Is it an entry file request */
  isEntry: boolean;
  /**
   * The path to send the request
   * - When the entry file is requested, it is represented as the project root directory
   * - When requesting a file, it is represented as a file directory
   */
  issuerPath: string;

  /** Original request */
  request: string;

  /** Request parameters */
  query?: string;
  startAt: number;
  endAt: number;
}

export interface PathResolverSuccessData extends PathResolverBaseData {
  /**
   * the resolved result.
   */
  result: string;
}

export interface PathResolverFailData extends PathResolverBaseData {
  error: Error;
  /**
   * stacks of the resolve paths which try to resolve.
   */
  stacks: ResolveStackData[];
}

export type PathResolverData = PathResolverSuccessData | PathResolverFailData;

export type ResolverData = PathResolverData[];
