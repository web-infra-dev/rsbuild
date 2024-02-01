import assert from 'node:assert';
import type { FinalOptions, Options } from '../types';
import codecs from './codecs';

export const withDefaultOptions = (opt: Options): FinalOptions => {
  const options = typeof opt === 'string' ? { use: opt } : opt;
  const { defaultOptions } = codecs[options.use];
  const ret = { ...defaultOptions, ...options };
  assert('test' in ret);
  return ret;
};
