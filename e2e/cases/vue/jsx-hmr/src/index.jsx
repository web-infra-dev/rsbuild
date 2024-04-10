import { createApp } from 'vue';
import { Named, NamedSpec, default as Default } from './Comps';
import { default as TsxDefault } from './Comp';
import JsxScript from './Script.vue';
import JsxSrcImport from './SrcImport.vue';
import JsxSetupSyntax from './setup-syntax-jsx.vue';
import TsImport from './TsImport.vue';

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
