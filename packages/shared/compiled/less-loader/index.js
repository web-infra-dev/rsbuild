(()=>{"use strict";var e={799:(e,t,r)=>{e.exports=r(945)["default"]},945:(e,t,r)=>{var n;n={value:true};t["default"]=void 0;var s=_interopRequireDefault(r(17));var i=_interopRequireDefault(r(757));var o=r(570);function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}async function lessLoader(e){const t=this.getOptions(i.default);const r=this.async();let n;try{n=(0,o.getLessImplementation)(this,t.implementation)}catch(e){r(e);return}if(!n){r(new Error(`The Less implementation "${t.implementation}" not found`));return}const a=(0,o.getLessOptions)(this,t,n);const l=typeof t.sourceMap==="boolean"?t.sourceMap:this.sourceMap;if(l){a.sourceMap={outputSourceFiles:true}}let u=e;if(typeof t.additionalData!=="undefined"){u=typeof t.additionalData==="function"?`${await t.additionalData(u,this)}`:`${t.additionalData}\n${u}`}const c=this.getLogger("less-loader");const p={error(e){c.error(e)},warn(e){c.warn(e)},info(e){c.log(e)},debug(e){c.debug(e)}};n.logger.addListener(p);let d;try{d=await n.render(u,a)}catch(e){if(e.filename){this.addDependency(s.default.normalize(e.filename))}r((0,o.errorFactory)(e));return}finally{n.logger.removeListener(p);delete a.pluginManager.webpackLoaderContext;delete a.pluginManager}const{css:f,imports:m}=d;m.forEach((e=>{if((0,o.isUnsupportedUrl)(e)){return}const t=s.default.normalize(e);if(s.default.isAbsolute(t)){this.addDependency(t)}}));let g=typeof d.map==="string"?JSON.parse(d.map):d.map;if(g&&l){g=(0,o.normalizeSourceMap)(g,this.rootContext)}r(null,f,g)}var a=lessLoader;t["default"]=a},570:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:true});t.errorFactory=errorFactory;t.getLessImplementation=getLessImplementation;t.getLessOptions=getLessOptions;t.isUnsupportedUrl=isUnsupportedUrl;t.normalizeSourceMap=normalizeSourceMap;var n=_interopRequireDefault(r(17));function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}const s=/[/\\]$/;const i=/^~[^/]+$/;const o=/^[a-z]:[/\\]|^\\\\/i;const a=/^~([^/]+|[^/]+\/|@[^/]+[/][^/]+|@[^/]+\/?|@[^/]+[/][^/]+\/)$/;const l=/^[^?]*~/;function createWebpackLessPlugin(e,t){const r=e.getResolve({dependencyType:"less",conditionNames:["less","style","..."],mainFields:["less","style","main","..."],mainFiles:["index","..."],extensions:[".less",".css"],preferRelative:true});class WebpackFileManager extends t.FileManager{supports(e){if(e[0]==="/"||o.test(e)){return true}if(this.isPathAbsolute(e)){return false}return true}supportsSync(){return false}async resolveFilename(e,t){const r=t.replace(s,"");let n=e;if(l.test(e)){n=n.replace(l,"")}if(a.test(e)){n=n[n.length-1]==="/"?n:`${n}/`}return this.resolveRequests(r,[...new Set([n,e])])}async resolveRequests(e,t){if(t.length===0){return Promise.reject()}let n;try{n=await r(e,t[0])}catch(r){const[,...s]=t;if(s.length===0){throw r}n=await this.resolveRequests(e,s)}return n}async loadFile(t,...r){let s;try{if(i.test(t)){const e=new Error;e.type="Next";throw e}s=await super.loadFile(t,...r)}catch(n){if(n.type!=="File"&&n.type!=="Next"){return Promise.reject(n)}try{s=await this.resolveFilename(t,...r)}catch(e){n.message=`Less resolver error:\n${n.message}\n\n`+`Webpack resolver error details:\n${e.details}\n\n`+`Webpack resolver error missing:\n${e.missing}\n\n`;return Promise.reject(n)}e.addDependency(s);return super.loadFile(s,...r)}const o=n.default.isAbsolute(s.filename)?s.filename:n.default.resolve(".",s.filename);e.addDependency(n.default.normalize(o));return s}}return{install(e,t){t.addFileManager(new WebpackFileManager)},minVersion:[3,0,0]}}function getLessOptions(e,t,r){const n=typeof t.lessOptions==="function"?t.lessOptions(e)||{}:t.lessOptions||{};const s={plugins:[],relativeUrls:true,filename:e.resourcePath,...n};const i=s.plugins.slice();const o=typeof t.webpackImporter==="boolean"?t.webpackImporter:true;if(o){i.unshift(createWebpackLessPlugin(e,r))}i.unshift({install(t,r){r.webpackLoaderContext=e;s.pluginManager=r}});s.plugins=i;return s}function isUnsupportedUrl(e){if(o.test(e)){return false}return/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(e)}function normalizeSourceMap(e){const t=e;delete t.file;t.sourceRoot="";t.sources=t.sources.map((e=>n.default.normalize(e)));return t}function getLessImplementation(e,t){let r=t;if(!t||typeof t==="string"){const e=t||"less";r=require(e)}return r}function getFileExcerptIfPossible(e){if(typeof e.extract==="undefined"){return[]}const t=e.extract.slice(0,2);const r=Math.max(e.column-1,0);if(typeof t[0]==="undefined"){t.shift()}t.push(`${new Array(r).join(" ")}^`);return t}function errorFactory(e){const t=["\n",...getFileExcerptIfPossible(e),e.message.charAt(0).toUpperCase()+e.message.slice(1),e.filename?`      Error in ${n.default.normalize(e.filename)} (line ${e.line}, column ${e.column})`:""].join("\n");const r=new Error(t,{cause:e});r.stack=null;return r}},17:e=>{e.exports=require("path")},757:e=>{e.exports=JSON.parse('{"title":"Less Loader options","type":"object","properties":{"lessOptions":{"description":"Options to pass through to `Less`.","link":"https://github.com/webpack-contrib/less-loader#lessoptions","anyOf":[{"type":"object","additionalProperties":true},{"instanceof":"Function"}]},"additionalData":{"description":"Prepends/Appends `Less` code to the actual entry file.","link":"https://github.com/webpack-contrib/less-loader#additionalData","anyOf":[{"type":"string"},{"instanceof":"Function"}]},"sourceMap":{"description":"Enables/Disables generation of source maps.","link":"https://github.com/webpack-contrib/less-loader#sourcemap","type":"boolean"},"webpackImporter":{"description":"Enables/Disables default `webpack` importer.","link":"https://github.com/webpack-contrib/less-loader#webpackimporter","type":"boolean"},"implementation":{"description":"The implementation of the `Less` to be used.","link":"https://github.com/webpack-contrib/less-loader#implementation","anyOf":[{"type":"string"},{"type":"object"}]}},"additionalProperties":false}')}};var t={};function __nccwpck_require__(r){var n=t[r];if(n!==undefined){return n.exports}var s=t[r]={exports:{}};var i=true;try{e[r](s,s.exports,__nccwpck_require__);i=false}finally{if(i)delete t[r]}return s.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var r=__nccwpck_require__(799);module.exports=r})();