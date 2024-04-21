import { createApp } from 'vue';
import { default as TsxDefault } from './Comp';
import { default as Default, Named, NamedSpec } from './Comps';
import JsxScript from './Script.vue';
import JsxSrcImport from './SrcImport.vue';
import TsImport from './TsImport.vue';
import JsxSetupSyntax from './setup-syntax-jsx.vue';

function App() {
  return (
    <>
      <Named />
      <NamedSpec />
      <Default />
      <TsxDefault />
      <JsxScript />
      <JsxSrcImport />
      <JsxSetupSyntax />
      <TsImport />
    </>
  );
}

createApp(App).mount('#root');
