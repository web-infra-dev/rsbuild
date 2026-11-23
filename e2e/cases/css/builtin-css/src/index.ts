import * as appStyles from './app.module.css';
import inlineCss from './inline.css?inline';
import rawCss from './inline.css?raw';
import './index.css';
import * as lessStyles from './style.module.less';
import * as sassStyles from './style.module.scss';

const root = document.querySelector('#root');
if (root) {
  const el = document.createElement('div');
  el.id = 'target';
  el.className = `${appStyles['box-title']} ${lessStyles['less-box']} ${sassStyles['sass-box']}`;
  el.textContent = 'builtin-css';
  root.appendChild(el);
}

(
  globalThis as typeof globalThis & {
    builtinCssResult: {
      appStyles: Record<string, string>;
      lessStyles: Record<string, string>;
      sassStyles: Record<string, string>;
      inlineCss: string;
      rawCss: string;
    };
  }
).builtinCssResult = {
  appStyles,
  lessStyles,
  sassStyles,
  inlineCss,
  rawCss,
};
