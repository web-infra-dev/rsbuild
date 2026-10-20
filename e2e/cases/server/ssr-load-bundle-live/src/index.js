import { increment, receiver, value } from 'runner-live';
import { value as reexported } from './bridge';

export async function observe() {
  const before = value;
  increment();
  const { lazy } = await import('./lazy');
  return {
    before,
    after: value,
    reexported,
    unbound: receiver() === undefined,
    lazy,
  };
}
