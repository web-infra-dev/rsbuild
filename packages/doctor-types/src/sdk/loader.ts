import { PlainObject } from '../common';
import { DevToolErrorInstance } from '../error';
import { ProcessData } from './process';

/** Single Loader conversion data for processing files */
export interface LoaderTransformData extends ProcessData {
  /** loader name */
  loader: string;
  /**
   * loader index
   */
  loaderIndex: number;

  /** loader path */
  path: string;
  input: string | null;
  /**
   * - isPitch: true: the result of loader.pitch()
   * - isPitch: false: the code result of loader()
   */
  result: string | null;

  /** Timestamp when called */
  startAt: number;
  endAt: number;

  /** loader configuration */
  options: PlainObject;
  /** pitching loader */
  isPitch: boolean;
  /**
   * is sync
   */
  sync: boolean;

  /** Error during conversion */
  errors: DevToolErrorInstance[];
}

/** Original file data */
export interface ResourceData {
  /**
   * Resource path
   * @example '/abc/resource.js'
   */
  path: string;
  /**
   * Resource parameters
   * @example '?rrr'
   */
  queryRaw: string;
  /**
   * Resource parameter object
   * @example '{ abc: true }'
   */
  query: PlainObject;
  /**
   * @example 'js'
   * @example 'txt'
   */
  ext: string;
}

/** File conversion process data */
export interface ResourceLoaderData {
  /** File data */
  resource: ResourceData;
  /** Passing loader */
  loaders: LoaderTransformData[];
}

export type LoaderData = ResourceLoaderData[];
