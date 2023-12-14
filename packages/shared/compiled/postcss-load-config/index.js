(()=>{var __webpack_modules__={959:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:true});t.lilconfigSync=t.lilconfig=t.defaultLoaders=void 0;const n=r(17);const s=r(147);const o=r(37);const c=s.promises.readFile;function getDefaultSearchPlaces(e){return["package.json",`.${e}rc.json`,`.${e}rc.js`,`.${e}rc.cjs`,`.config/${e}rc`,`.config/${e}rc.json`,`.config/${e}rc.js`,`.config/${e}rc.cjs`,`${e}.config.js`,`${e}.config.cjs`]}function parentDir(e){return n.dirname(e)||n.sep}t.defaultLoaders=Object.freeze({".js":require,".json":require,".cjs":require,noExt(e,t){return JSON.parse(t)}});function getExtDesc(e){return e==="noExt"?"files without extensions":`extension "${e}"`}function getOptions(e,r={}){const s={stopDir:o.homedir(),searchPlaces:getDefaultSearchPlaces(e),ignoreEmptySearchPlaces:true,cache:true,transform:e=>e,packageProp:[e],...r,loaders:{...t.defaultLoaders,...r.loaders}};s.searchPlaces.forEach((e=>{const t=n.extname(e)||"noExt";const r=s.loaders[t];if(!r){throw new Error(`No loader specified for ${getExtDesc(t)}, so searchPlaces item "${e}" is invalid`)}if(typeof r!=="function"){throw new Error(`loader for ${getExtDesc(t)} is not a function (type provided: "${typeof r}"), so searchPlaces item "${e}" is invalid`)}}));return s}function getPackageProp(e,t){if(typeof e==="string"&&e in t)return t[e];return(Array.isArray(e)?e:e.split(".")).reduce(((e,t)=>e===undefined?e:e[t]),t)||null}function validateFilePath(e){if(!e)throw new Error("load must pass a non-empty string")}function validateLoader(e,t){if(!e)throw new Error(`No loader specified for extension "${t}"`);if(typeof e!=="function")throw new Error("loader is not a function")}const makeEmplace=e=>(t,r,n)=>{if(e)t.set(r,n);return n};function lilconfig(e,t){const{ignoreEmptySearchPlaces:r,loaders:o,packageProp:i,searchPlaces:a,stopDir:f,transform:l,cache:u}=getOptions(e,t);const p=new Map;const d=new Map;const g=makeEmplace(u);return{async search(e=process.cwd()){const t={config:null,filepath:""};const d=new Set;let g=e;e:while(true){if(u){const e=p.get(g);if(e!==undefined){for(const t of d)p.set(t,e);return e}d.add(g)}for(const e of a){const a=n.join(g,e);try{await s.promises.access(a)}catch(e){continue}const f=String(await c(a));const l=n.extname(e)||"noExt";const u=o[l];if(e==="package.json"){const e=await u(a,f);const r=getPackageProp(i,e);if(r!=null){t.config=r;t.filepath=a;break e}continue}const p=f.trim()==="";if(p&&r)continue;if(p){t.isEmpty=true;t.config=undefined}else{validateLoader(u,l);t.config=await u(a,f)}t.filepath=a;break e}if(g===f||g===parentDir(g))break e;g=parentDir(g)}const h=t.filepath===""&&t.config===null?l(null):l(t);if(u){for(const e of d)p.set(e,h)}return h},async load(e){validateFilePath(e);const t=n.resolve(process.cwd(),e);if(u&&d.has(t)){return d.get(t)}const{base:s,ext:a}=n.parse(t);const f=a||"noExt";const p=o[f];validateLoader(p,f);const h=String(await c(t));if(s==="package.json"){const e=await p(t,h);return g(d,t,l({config:getPackageProp(i,e),filepath:t}))}const _={config:null,filepath:t};const y=h.trim()==="";if(y&&r)return g(d,t,l({config:undefined,filepath:t,isEmpty:true}));_.config=y?undefined:await p(t,h);return g(d,t,l(y?{..._,isEmpty:y,config:undefined}:_))},clearLoadCache(){if(u)d.clear()},clearSearchCache(){if(u)p.clear()},clearCaches(){if(u){d.clear();p.clear()}}}}t.lilconfig=lilconfig;function lilconfigSync(e,t){const{ignoreEmptySearchPlaces:r,loaders:o,packageProp:c,searchPlaces:i,stopDir:a,transform:f,cache:l}=getOptions(e,t);const u=new Map;const p=new Map;const d=makeEmplace(l);return{search(e=process.cwd()){const t={config:null,filepath:""};const p=new Set;let d=e;e:while(true){if(l){const e=u.get(d);if(e!==undefined){for(const t of p)u.set(t,e);return e}p.add(d)}for(const e of i){const i=n.join(d,e);try{s.accessSync(i)}catch(e){continue}const a=n.extname(e)||"noExt";const f=o[a];const l=String(s.readFileSync(i));if(e==="package.json"){const e=f(i,l);const r=getPackageProp(c,e);if(r!=null){t.config=r;t.filepath=i;break e}continue}const u=l.trim()==="";if(u&&r)continue;if(u){t.isEmpty=true;t.config=undefined}else{validateLoader(f,a);t.config=f(i,l)}t.filepath=i;break e}if(d===a||d===parentDir(d))break e;d=parentDir(d)}const g=t.filepath===""&&t.config===null?f(null):f(t);if(l){for(const e of p)u.set(e,g)}return g},load(e){validateFilePath(e);const t=n.resolve(process.cwd(),e);if(l&&p.has(t)){return p.get(t)}const{base:i,ext:a}=n.parse(t);const u=a||"noExt";const g=o[u];validateLoader(g,u);const h=String(s.readFileSync(t));if(i==="package.json"){const e=g(t,h);return f({config:getPackageProp(c,e),filepath:t})}const _={config:null,filepath:t};const y=h.trim()==="";if(y&&r)return d(p,t,f({filepath:t,config:undefined,isEmpty:true}));_.config=y?undefined:g(t,h);return d(p,t,f(y?{..._,isEmpty:y,config:undefined}:_))},clearLoadCache(){if(l)p.clear()},clearSearchCache(){if(l)u.clear()},clearCaches(){if(l){p.clear();u.clear()}}}}t.lilconfigSync=lilconfigSync},367:(e,t,r)=>{"use strict";const n=r(17).resolve;const s=r(310);const o=r(959);const c=r(687);const i=r(239);const a=r(434);const interopRequireDefault=e=>e&&e.__esModule?e:{default:e};const processResult=(e,t)=>{const r=t.filepath||"";let n=interopRequireDefault(t.config).default||{};if(typeof n==="function"){n=n(e)}else{n=Object.assign({},n,e)}if(!n.plugins){n.plugins=[]}return{plugins:a(n,r),options:i(n,r),file:r}};const createContext=e=>{e=Object.assign({cwd:process.cwd(),env:process.env.NODE_ENV},e);if(!e.env){process.env.NODE_ENV="development"}return e};const importDefault=async e=>{const t=await r(70)(s.pathToFileURL(e).href);return t.default};const addTypeScriptLoader=(e={},t)=>{const r="postcss";return{...e,searchPlaces:[...e.searchPlaces||[],"package.json",`.${r}rc`,`.${r}rc.json`,`.${r}rc.yaml`,`.${r}rc.yml`,`.${r}rc.ts`,`.${r}rc.cts`,`.${r}rc.js`,`.${r}rc.cjs`,`.${r}rc.mjs`,`${r}.config.ts`,`${r}.config.cts`,`${r}.config.js`,`${r}.config.cjs`,`${r}.config.mjs`],loaders:{...e.loaders,".yaml":(e,t)=>c.parse(t),".yml":(e,t)=>c.parse(t),".js":importDefault,".cjs":importDefault,".mjs":importDefault,".ts":t,".cts":t}}};const withTypeScriptLoader=e=>(t,n,s)=>e(t,n,addTypeScriptLoader(s,(e=>{let t={enabled(){}};try{t=r(592).register({moduleTypes:{"**/*.cts":"cjs"}});return require(e)}catch(e){if(e.code==="MODULE_NOT_FOUND"){throw new Error(`'ts-node' is required for the TypeScript configuration files. Make sure it is installed\nError: ${e.message}`)}throw e}finally{t.enabled(false)}})));const f=withTypeScriptLoader(((e,t,r)=>{e=createContext(e);t=t?n(t):process.cwd();return o.lilconfig("postcss",r).search(t).then((r=>{if(!r){throw new Error(`No PostCSS Config found in: ${t}`)}return processResult(e,r)}))}))
/**
 * Autoload Config for PostCSS
 *
 * @author Michael Ciniawsky @michael-ciniawsky <michael.ciniawsky@gmail.com>
 * @license MIT
 *
 * @module postcss-load-config
 * @version 2.1.0
 *
 * @requires comsiconfig
 * @requires ./options
 * @requires ./plugins
 */;e.exports=f},239:(e,t,r)=>{"use strict";const n=r(445);const options=(e,t)=>{if(e.parser&&typeof e.parser==="string"){try{e.parser=n(e.parser,t)}catch(e){throw new Error(`Loading PostCSS Parser failed: ${e.message}\n\n(@${t})`)}}if(e.syntax&&typeof e.syntax==="string"){try{e.syntax=n(e.syntax,t)}catch(e){throw new Error(`Loading PostCSS Syntax failed: ${e.message}\n\n(@${t})`)}}if(e.stringifier&&typeof e.stringifier==="string"){try{e.stringifier=n(e.stringifier,t)}catch(e){throw new Error(`Loading PostCSS Stringifier failed: ${e.message}\n\n(@${t})`)}}if(e.plugins){delete e.plugins}return e};e.exports=options},434:(e,t,r)=>{"use strict";const n=r(445);const load=(e,t,r)=>{try{if(t===null||t===undefined||Object.keys(t).length===0){return n(e,r)}else{return n(e,r)(t)}}catch(e){throw new Error(`Loading PostCSS Plugin failed: ${e.message}\n\n(@${r})`)}};const plugins=(e,t)=>{let r=[];if(Array.isArray(e.plugins)){r=e.plugins.filter(Boolean)}else{r=Object.keys(e.plugins).filter((t=>e.plugins[t]!==false?t:"")).map((r=>load(r,e.plugins[r],t)))}if(r.length&&r.length>0){r.forEach(((e,r)=>{if(e.default){e=e.default}if(e.postcss===true){e=e()}else if(e.postcss){e=e.postcss}if(!(typeof e==="object"&&Array.isArray(e.plugins)||typeof e==="object"&&e.postcssPlugin||typeof e==="function")){throw new TypeError(`Invalid PostCSS Plugin found at: plugins[${r}]\n\n(@${t})`)}}))}return r};e.exports=plugins},445:(e,t,r)=>{const{createRequire:n,createRequireFromPath:s}=r(188);function req(e,t){const r=n||s;const o=r(t);return o(e)}e.exports=req},592:module=>{module.exports=eval("require")("ts-node")},70:e=>{function webpackEmptyAsyncContext(e){return Promise.resolve().then((()=>{var t=new Error("Cannot find module '"+e+"'");t.code="MODULE_NOT_FOUND";throw t}))}webpackEmptyAsyncContext.keys=()=>[];webpackEmptyAsyncContext.resolve=webpackEmptyAsyncContext;webpackEmptyAsyncContext.id=70;e.exports=webpackEmptyAsyncContext},687:e=>{"use strict";e.exports=require("../yaml")},147:e=>{"use strict";e.exports=require("fs")},188:e=>{"use strict";e.exports=require("module")},37:e=>{"use strict";e.exports=require("os")},17:e=>{"use strict";e.exports=require("path")},310:e=>{"use strict";e.exports=require("url")}};var __webpack_module_cache__={};function __nccwpck_require__(e){var t=__webpack_module_cache__[e];if(t!==undefined){return t.exports}var r=__webpack_module_cache__[e]={exports:{}};var n=true;try{__webpack_modules__[e](r,r.exports,__nccwpck_require__);n=false}finally{if(n)delete __webpack_module_cache__[e]}return r.exports}(()=>{__nccwpck_require__.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t)})();if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var __webpack_exports__=__nccwpck_require__(367);module.exports=__webpack_exports__})();