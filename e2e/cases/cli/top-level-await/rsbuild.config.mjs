import { defineConfig } from '@rsbuild/core';

async function asyncFunction() {
  return new Promise((resolve) => setTimeout(resolve));
}

await asyncFunction();

export default defineConfig({
  output: {
    filenameHash: false,
  },
});
