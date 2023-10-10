import assert from 'assert';
import { inspect } from 'util';
import { lodash } from '@rsbuild/shared/lodash';
import { JSONValue } from '@modern-js/builder-shared';
import { ThrowableType, TracingFrame } from '../shared/types';
import StackTracey from 'stacktracey';
import { formatError } from '../shared/utils';
import { Context } from './context';

export const getErrorCause = (error: Error) => {
  assert(typeof error === 'object', 'Error must be an object');
  const err = error as any;
  return [err.cause, err.error, err.originalError].find(lodash.isError);
};

export type Serializable<T> = {
  [K in keyof T]: T[K] extends JSONValue ? T[K] : never;
};

export class ParsedError<E extends Error = Error> {
  type: ThrowableType = 'error';

  cause?: ParsedError;

  causes: ParsedError[] = [];

  trace: TracingFrame[] = [];

  parent?: ParsedError;

  raw: E;

  name: string;

  message: string;

  context: Context;

  constructor(error: E, context = new Context()) {
    this.raw = error;
    this.name = this.raw.name ?? 'Error';
    this.message = this.raw.message ?? '';
    this.context = context;

    if (context.withSources) {
      this.trace = new StackTracey(error).withSources().items;
    } else {
      this.trace = new StackTracey(error).items;
    }

    const rawCause = getErrorCause(this.raw);
    if (rawCause) {
      this.cause = new ParsedError(rawCause);
      this.cause.parent = this;
      this.causes.push(this.cause, ...this.cause.causes);
    }
  }

  [inspect.custom]() {
    const formatted = formatError(this.context.formatters, this);
    return formatted;
  }

  freeze(): Readonly<this> {
    const ret = { ...this, [inspect.custom]: lodash.constant(inspect(this)) };
    return Object.freeze(ret);
  }
}
