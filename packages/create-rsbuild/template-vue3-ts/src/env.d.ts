/// <reference types="@rsbuild/core/types" />

declare module '*.vue' {
  import type { ComponentOptions } from 'vue';

  const component: DefineComponent<{}, {}, any>;
  export default component;
}
