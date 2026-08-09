import { expect, test } from '@rstest/core';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';

test('renders the main page', () => {
  const testMessage = 'Rsbuild with Vue';
  const wrapper = mount(App);
  expect(wrapper.element).toHaveTextContent(testMessage);
});
