import { getBabelConfigForNode } from '../src/node';

test('should provide node preset as expected', () => {
  expect(getBabelConfigForNode()).toMatchSnapshot();
});
