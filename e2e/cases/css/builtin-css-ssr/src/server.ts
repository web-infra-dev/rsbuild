import './ssr-global.css';
import './ssr-tailwind.css';
import './ssr-global.less';
import './ssr-global.scss';
import css from './style.module.css';
import less from './style.module.less';
import sass from './style.module.scss';
import missingUrlMod from './ssr-missing-url.module.css';
import inline from './inline.css?inline';
import raw from './raw.css?raw';
import url from './url.css?url';

console.log(
  JSON.stringify({
    css,
    less,
    sass,
    missingUrlMod,
    inline,
    raw,
    url,
  }),
);
