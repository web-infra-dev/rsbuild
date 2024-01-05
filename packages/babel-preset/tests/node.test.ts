import { getBabelConfigForNode } from '../src/node';

test('should provide node preset as expected', () => {
  expect(getBabelConfigForNode()).toMatchSnapshot();
});

test('should allow to override target node version', () => {
  expect(
    getBabelConfigForNode({
      presetEnv: {
        targets: ['node >= 20'],
      },
    }),
  ).toMatchSnapshot();
});
