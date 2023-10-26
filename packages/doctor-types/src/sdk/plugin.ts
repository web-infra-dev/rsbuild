import { DevToolErrorInstance } from '../error';

export interface PluginHookData {
  /** hook tap name */
  tapName: string;
  /** hook call time-consuming */
  costs: number;
  startAt: number;
  endAt: number;
  /** hook function type */
  type: 'sync' | 'async' | 'promise';

  /** hook function result */
  result: any;

  /** hook function running error */
  error: DevToolErrorInstance[];
}

/**
 * Plugin data
 * - Key name Hook name
 * - Key value is the hook data array
 */
export type PluginData = Record<string, PluginHookData[]>;
