import { getBabelPresetForNode } from '../src/node';

test('should provide node preset as expected', () => {
  expect(getBabelPresetForNode()).toMatchSnapshot();
});
