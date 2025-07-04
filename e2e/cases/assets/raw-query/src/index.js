import img from '@assets/circle.svg?raw';
import rawTs from './bar.ts?raw';
import rawTsx from './baz.tsx?raw';
import normalJs from './foo.js?other_raw';
import rawJs from './foo.js?raw';

window.rawImg = img;
window.rawJs = rawJs;
window.rawTs = rawTs;
window.rawTsx = rawTsx;
window.normalJs = normalJs;
