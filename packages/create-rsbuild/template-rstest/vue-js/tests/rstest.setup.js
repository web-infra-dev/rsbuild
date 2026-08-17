import { afterEach, expect } from '@rstest/core';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { enableAutoUnmount } from '@vue/test-utils';

expect.extend(jestDomMatchers);
enableAutoUnmount(afterEach);
