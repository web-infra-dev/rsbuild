import { prettyTime } from '../src';

test('should pretty time correctly', () => {
  expect(prettyTime(0.0012)).toEqual('0.001 s');
  expect(prettyTime(0.0123)).toEqual('0.01 s');
  expect(prettyTime(0.1234)).toEqual('0.12 s');
  expect(prettyTime(1.234)).toEqual('1.23 s');
  expect(prettyTime(12.34)).toEqual('12.3 s');
  expect(prettyTime(123.4)).toEqual('2.06 m');
  expect(prettyTime(1234)).toEqual('20.57 m');
});
