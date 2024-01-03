(()=>{var e={156:(e,t,r)=>{"use strict";const n=r(796);const i=r(17);const o=r(933).mkdirsSync;const c=r(651).utimesMillisSync;const s=r(470);function copySync(e,t,r){if(typeof r==="function"){r={filter:r}}r=r||{};r.clobber="clobber"in r?!!r.clobber:true;r.overwrite="overwrite"in r?!!r.overwrite:r.clobber;if(r.preserveTimestamps&&process.arch==="ia32"){process.emitWarning("Using the preserveTimestamps option in 32-bit node is not recommended;\n\n"+"\tsee https://github.com/jprichardson/node-fs-extra/issues/269","Warning","fs-extra-WARN0002")}const{srcStat:c,destStat:a}=s.checkPathsSync(e,t,"copy",r);s.checkParentPathsSync(e,c,t,"copy");if(r.filter&&!r.filter(e,t))return;const u=i.dirname(t);if(!n.existsSync(u))o(u);return getStats(a,e,t,r)}function getStats(e,t,r,i){const o=i.dereference?n.statSync:n.lstatSync;const c=o(t);if(c.isDirectory())return onDir(c,e,t,r,i);else if(c.isFile()||c.isCharacterDevice()||c.isBlockDevice())return onFile(c,e,t,r,i);else if(c.isSymbolicLink())return onLink(e,t,r,i);else if(c.isSocket())throw new Error(`Cannot copy a socket file: ${t}`);else if(c.isFIFO())throw new Error(`Cannot copy a FIFO pipe: ${t}`);throw new Error(`Unknown file: ${t}`)}function onFile(e,t,r,n,i){if(!t)return copyFile(e,r,n,i);return mayCopyFile(e,r,n,i)}function mayCopyFile(e,t,r,i){if(i.overwrite){n.unlinkSync(r);return copyFile(e,t,r,i)}else if(i.errorOnExist){throw new Error(`'${r}' already exists`)}}function copyFile(e,t,r,i){n.copyFileSync(t,r);if(i.preserveTimestamps)handleTimestamps(e.mode,t,r);return setDestMode(r,e.mode)}function handleTimestamps(e,t,r){if(fileIsNotWritable(e))makeFileWritable(r,e);return setDestTimestamps(t,r)}function fileIsNotWritable(e){return(e&128)===0}function makeFileWritable(e,t){return setDestMode(e,t|128)}function setDestMode(e,t){return n.chmodSync(e,t)}function setDestTimestamps(e,t){const r=n.statSync(e);return c(t,r.atime,r.mtime)}function onDir(e,t,r,n,i){if(!t)return mkDirAndCopy(e.mode,r,n,i);return copyDir(r,n,i)}function mkDirAndCopy(e,t,r,i){n.mkdirSync(r);copyDir(t,r,i);return setDestMode(r,e)}function copyDir(e,t,r){n.readdirSync(e).forEach((n=>copyDirItem(n,e,t,r)))}function copyDirItem(e,t,r,n){const o=i.join(t,e);const c=i.join(r,e);if(n.filter&&!n.filter(o,c))return;const{destStat:a}=s.checkPathsSync(o,c,"copy",n);return getStats(a,o,c,n)}function onLink(e,t,r,o){let c=n.readlinkSync(t);if(o.dereference){c=i.resolve(process.cwd(),c)}if(!e){return n.symlinkSync(c,r)}else{let e;try{e=n.readlinkSync(r)}catch(e){if(e.code==="EINVAL"||e.code==="UNKNOWN")return n.symlinkSync(c,r);throw e}if(o.dereference){e=i.resolve(process.cwd(),e)}if(s.isSrcSubdir(c,e)){throw new Error(`Cannot copy '${c}' to a subdirectory of itself, '${e}'.`)}if(s.isSrcSubdir(e,c)){throw new Error(`Cannot overwrite '${e}' with '${c}'.`)}return copyLink(c,r)}}function copyLink(e,t){n.unlinkSync(t);return n.symlinkSync(e,t)}e.exports=copySync},938:(e,t,r)=>{"use strict";const n=r(357);const i=r(17);const{mkdirs:o}=r(933);const{pathExists:c}=r(932);const{utimesMillis:s}=r(651);const a=r(470);async function copy(e,t,r={}){if(typeof r==="function"){r={filter:r}}r.clobber="clobber"in r?!!r.clobber:true;r.overwrite="overwrite"in r?!!r.overwrite:r.clobber;if(r.preserveTimestamps&&process.arch==="ia32"){process.emitWarning("Using the preserveTimestamps option in 32-bit node is not recommended;\n\n"+"\tsee https://github.com/jprichardson/node-fs-extra/issues/269","Warning","fs-extra-WARN0001")}const{srcStat:n,destStat:s}=await a.checkPaths(e,t,"copy",r);await a.checkParentPaths(e,n,t,"copy");const u=await runFilter(e,t,r);if(!u)return;const f=i.dirname(t);const l=await c(f);if(!l){await o(f)}await getStatsAndPerformCopy(s,e,t,r)}async function runFilter(e,t,r){if(!r.filter)return true;return r.filter(e,t)}async function getStatsAndPerformCopy(e,t,r,i){const o=i.dereference?n.stat:n.lstat;const c=await o(t);if(c.isDirectory())return onDir(c,e,t,r,i);if(c.isFile()||c.isCharacterDevice()||c.isBlockDevice())return onFile(c,e,t,r,i);if(c.isSymbolicLink())return onLink(e,t,r,i);if(c.isSocket())throw new Error(`Cannot copy a socket file: ${t}`);if(c.isFIFO())throw new Error(`Cannot copy a FIFO pipe: ${t}`);throw new Error(`Unknown file: ${t}`)}async function onFile(e,t,r,i,o){if(!t)return copyFile(e,r,i,o);if(o.overwrite){await n.unlink(i);return copyFile(e,r,i,o)}if(o.errorOnExist){throw new Error(`'${i}' already exists`)}}async function copyFile(e,t,r,i){await n.copyFile(t,r);if(i.preserveTimestamps){if(fileIsNotWritable(e.mode)){await makeFileWritable(r,e.mode)}const i=await n.stat(t);await s(r,i.atime,i.mtime)}return n.chmod(r,e.mode)}function fileIsNotWritable(e){return(e&128)===0}function makeFileWritable(e,t){return n.chmod(e,t|128)}async function onDir(e,t,r,o,c){if(!t){await n.mkdir(o)}const s=await n.readdir(r);await Promise.all(s.map((async e=>{const t=i.join(r,e);const n=i.join(o,e);const s=await runFilter(t,n,c);if(!s)return;const{destStat:u}=await a.checkPaths(t,n,"copy",c);return getStatsAndPerformCopy(u,t,n,c)})));if(!t){await n.chmod(o,e.mode)}}async function onLink(e,t,r,o){let c=await n.readlink(t);if(o.dereference){c=i.resolve(process.cwd(),c)}if(!e){return n.symlink(c,r)}let s=null;try{s=await n.readlink(r)}catch(e){if(e.code==="EINVAL"||e.code==="UNKNOWN")return n.symlink(c,r);throw e}if(o.dereference){s=i.resolve(process.cwd(),s)}if(a.isSrcSubdir(c,s)){throw new Error(`Cannot copy '${c}' to a subdirectory of itself, '${s}'.`)}if(a.isSrcSubdir(s,c)){throw new Error(`Cannot overwrite '${s}' with '${c}'.`)}await n.unlink(r);return n.symlink(c,r)}e.exports=copy},798:(e,t,r)=>{"use strict";const n=r(469).fromPromise;e.exports={copy:n(r(938)),copySync:r(156)}},547:(e,t,r)=>{"use strict";const n=r(469).fromPromise;const i=r(357);const o=r(17);const c=r(933);const s=r(373);const a=n((async function emptyDir(e){let t;try{t=await i.readdir(e)}catch{return c.mkdirs(e)}return Promise.all(t.map((t=>s.remove(o.join(e,t)))))}));function emptyDirSync(e){let t;try{t=i.readdirSync(e)}catch{return c.mkdirsSync(e)}t.forEach((t=>{t=o.join(e,t);s.removeSync(t)}))}e.exports={emptyDirSync:emptyDirSync,emptydirSync:emptyDirSync,emptyDir:a,emptydir:a}},412:(e,t,r)=>{"use strict";const n=r(469).fromPromise;const i=r(17);const o=r(357);const c=r(933);async function createFile(e){let t;try{t=await o.stat(e)}catch{}if(t&&t.isFile())return;const r=i.dirname(e);let n=null;try{n=await o.stat(r)}catch(t){if(t.code==="ENOENT"){await c.mkdirs(r);await o.writeFile(e,"");return}else{throw t}}if(n.isDirectory()){await o.writeFile(e,"")}else{await o.readdir(r)}}function createFileSync(e){let t;try{t=o.statSync(e)}catch{}if(t&&t.isFile())return;const r=i.dirname(e);try{if(!o.statSync(r).isDirectory()){o.readdirSync(r)}}catch(e){if(e&&e.code==="ENOENT")c.mkdirsSync(r);else throw e}o.writeFileSync(e,"")}e.exports={createFile:n(createFile),createFileSync:createFileSync}},520:(e,t,r)=>{"use strict";const{createFile:n,createFileSync:i}=r(412);const{createLink:o,createLinkSync:c}=r(677);const{createSymlink:s,createSymlinkSync:a}=r(386);e.exports={createFile:n,createFileSync:i,ensureFile:n,ensureFileSync:i,createLink:o,createLinkSync:c,ensureLink:o,ensureLinkSync:c,createSymlink:s,createSymlinkSync:a,ensureSymlink:s,ensureSymlinkSync:a}},677:(e,t,r)=>{"use strict";const n=r(469).fromPromise;const i=r(17);const o=r(357);const c=r(933);const{pathExists:s}=r(932);const{areIdentical:a}=r(470);async function createLink(e,t){let r;try{r=await o.lstat(t)}catch{}let n;try{n=await o.lstat(e)}catch(e){e.message=e.message.replace("lstat","ensureLink");throw e}if(r&&a(n,r))return;const u=i.dirname(t);const f=await s(u);if(!f){await c.mkdirs(u)}await o.link(e,t)}function createLinkSync(e,t){let r;try{r=o.lstatSync(t)}catch{}try{const t=o.lstatSync(e);if(r&&a(t,r))return}catch(e){e.message=e.message.replace("lstat","ensureLink");throw e}const n=i.dirname(t);const s=o.existsSync(n);if(s)return o.linkSync(e,t);c.mkdirsSync(n);return o.linkSync(e,t)}e.exports={createLink:n(createLink),createLinkSync:createLinkSync}},863:(e,t,r)=>{"use strict";const n=r(17);const i=r(357);const{pathExists:o}=r(932);const c=r(469).fromPromise;async function symlinkPaths(e,t){if(n.isAbsolute(e)){try{await i.lstat(e)}catch(e){e.message=e.message.replace("lstat","ensureSymlink");throw e}return{toCwd:e,toDst:e}}const r=n.dirname(t);const c=n.join(r,e);const s=await o(c);if(s){return{toCwd:c,toDst:e}}try{await i.lstat(e)}catch(e){e.message=e.message.replace("lstat","ensureSymlink");throw e}return{toCwd:e,toDst:n.relative(r,e)}}function symlinkPathsSync(e,t){if(n.isAbsolute(e)){const t=i.existsSync(e);if(!t)throw new Error("absolute srcpath does not exist");return{toCwd:e,toDst:e}}const r=n.dirname(t);const o=n.join(r,e);const c=i.existsSync(o);if(c){return{toCwd:o,toDst:e}}const s=i.existsSync(e);if(!s)throw new Error("relative srcpath does not exist");return{toCwd:e,toDst:n.relative(r,e)}}e.exports={symlinkPaths:c(symlinkPaths),symlinkPathsSync:symlinkPathsSync}},16:(e,t,r)=>{"use strict";const n=r(357);const i=r(469).fromPromise;async function symlinkType(e,t){if(t)return t;let r;try{r=await n.lstat(e)}catch{return"file"}return r&&r.isDirectory()?"dir":"file"}function symlinkTypeSync(e,t){if(t)return t;let r;try{r=n.lstatSync(e)}catch{return"file"}return r&&r.isDirectory()?"dir":"file"}e.exports={symlinkType:i(symlinkType),symlinkTypeSync:symlinkTypeSync}},386:(e,t,r)=>{"use strict";const n=r(469).fromPromise;const i=r(17);const o=r(357);const{mkdirs:c,mkdirsSync:s}=r(933);const{symlinkPaths:a,symlinkPathsSync:u}=r(863);const{symlinkType:f,symlinkTypeSync:l}=r(16);const{pathExists:y}=r(932);const{areIdentical:p}=r(470);async function createSymlink(e,t,r){let n;try{n=await o.lstat(t)}catch{}if(n&&n.isSymbolicLink()){const[r,n]=await Promise.all([o.stat(e),o.stat(t)]);if(p(r,n))return}const s=await a(e,t);e=s.toDst;const u=await f(s.toCwd,r);const l=i.dirname(t);if(!await y(l)){await c(l)}return o.symlink(e,t,u)}function createSymlinkSync(e,t,r){let n;try{n=o.lstatSync(t)}catch{}if(n&&n.isSymbolicLink()){const r=o.statSync(e);const n=o.statSync(t);if(p(r,n))return}const c=u(e,t);e=c.toDst;r=l(c.toCwd,r);const a=i.dirname(t);const f=o.existsSync(a);if(f)return o.symlinkSync(e,t,r);s(a);return o.symlinkSync(e,t,r)}e.exports={createSymlink:n(createSymlink),createSymlinkSync:createSymlinkSync}},357:(e,t,r)=>{"use strict";const n=r(469).fromCallback;const i=r(796);const o=["access","appendFile","chmod","chown","close","copyFile","fchmod","fchown","fdatasync","fstat","fsync","ftruncate","futimes","lchmod","lchown","link","lstat","mkdir","mkdtemp","open","opendir","readdir","readFile","readlink","realpath","rename","rm","rmdir","stat","symlink","truncate","unlink","utimes","writeFile"].filter((e=>typeof i[e]==="function"));Object.assign(t,i);o.forEach((e=>{t[e]=n(i[e])}));t.exists=function(e,t){if(typeof t==="function"){return i.exists(e,t)}return new Promise((t=>i.exists(e,t)))};t.read=function(e,t,r,n,o,c){if(typeof c==="function"){return i.read(e,t,r,n,o,c)}return new Promise(((c,s)=>{i.read(e,t,r,n,o,((e,t,r)=>{if(e)return s(e);c({bytesRead:t,buffer:r})}))}))};t.write=function(e,t,...r){if(typeof r[r.length-1]==="function"){return i.write(e,t,...r)}return new Promise(((n,o)=>{i.write(e,t,...r,((e,t,r)=>{if(e)return o(e);n({bytesWritten:t,buffer:r})}))}))};t.readv=function(e,t,...r){if(typeof r[r.length-1]==="function"){return i.readv(e,t,...r)}return new Promise(((n,o)=>{i.readv(e,t,...r,((e,t,r)=>{if(e)return o(e);n({bytesRead:t,buffers:r})}))}))};t.writev=function(e,t,...r){if(typeof r[r.length-1]==="function"){return i.writev(e,t,...r)}return new Promise(((n,o)=>{i.writev(e,t,...r,((e,t,r)=>{if(e)return o(e);n({bytesWritten:t,buffers:r})}))}))};if(typeof i.realpath.native==="function"){t.realpath.native=n(i.realpath.native)}else{process.emitWarning("fs.realpath.native is not a function. Is fs being monkey-patched?","Warning","fs-extra-WARN0003")}},921:(e,t,r)=>{"use strict";e.exports={...r(357),...r(798),...r(547),...r(520),...r(342),...r(933),...r(41),...r(693),...r(932),...r(373)}},342:(e,t,r)=>{"use strict";const n=r(469).fromPromise;const i=r(990);i.outputJson=n(r(859));i.outputJsonSync=r(690);i.outputJSON=i.outputJson;i.outputJSONSync=i.outputJsonSync;i.writeJSON=i.writeJson;i.writeJSONSync=i.writeJsonSync;i.readJSON=i.readJson;i.readJSONSync=i.readJsonSync;e.exports=i},990:(e,t,r)=>{"use strict";const n=r(313);e.exports={readJson:n.readFile,readJsonSync:n.readFileSync,writeJson:n.writeFile,writeJsonSync:n.writeFileSync}},690:(e,t,r)=>{"use strict";const{stringify:n}=r(6);const{outputFileSync:i}=r(693);function outputJsonSync(e,t,r){const o=n(t,r);i(e,o,r)}e.exports=outputJsonSync},859:(e,t,r)=>{"use strict";const{stringify:n}=r(6);const{outputFile:i}=r(693);async function outputJson(e,t,r={}){const o=n(t,r);await i(e,o,r)}e.exports=outputJson},933:(e,t,r)=>{"use strict";const n=r(469).fromPromise;const{makeDir:i,makeDirSync:o}=r(517);const c=n(i);e.exports={mkdirs:c,mkdirsSync:o,mkdirp:c,mkdirpSync:o,ensureDir:c,ensureDirSync:o}},517:(e,t,r)=>{"use strict";const n=r(357);const{checkPath:i}=r(222);const getMode=e=>{const t={mode:511};if(typeof e==="number")return e;return{...t,...e}.mode};e.exports.makeDir=async(e,t)=>{i(e);return n.mkdir(e,{mode:getMode(t),recursive:true})};e.exports.makeDirSync=(e,t)=>{i(e);return n.mkdirSync(e,{mode:getMode(t),recursive:true})}},222:(e,t,r)=>{"use strict";const n=r(17);e.exports.checkPath=function checkPath(e){if(process.platform==="win32"){const t=/[<>:"|?*]/.test(e.replace(n.parse(e).root,""));if(t){const t=new Error(`Path contains invalid characters: ${e}`);t.code="EINVAL";throw t}}}},41:(e,t,r)=>{"use strict";const n=r(469).fromPromise;e.exports={move:n(r(980)),moveSync:r(140)}},140:(e,t,r)=>{"use strict";const n=r(796);const i=r(17);const o=r(798).copySync;const c=r(373).removeSync;const s=r(933).mkdirpSync;const a=r(470);function moveSync(e,t,r){r=r||{};const n=r.overwrite||r.clobber||false;const{srcStat:o,isChangingCase:c=false}=a.checkPathsSync(e,t,"move",r);a.checkParentPathsSync(e,o,t,"move");if(!isParentRoot(t))s(i.dirname(t));return doRename(e,t,n,c)}function isParentRoot(e){const t=i.dirname(e);const r=i.parse(t);return r.root===t}function doRename(e,t,r,i){if(i)return rename(e,t,r);if(r){c(t);return rename(e,t,r)}if(n.existsSync(t))throw new Error("dest already exists.");return rename(e,t,r)}function rename(e,t,r){try{n.renameSync(e,t)}catch(n){if(n.code!=="EXDEV")throw n;return moveAcrossDevice(e,t,r)}}function moveAcrossDevice(e,t,r){const n={overwrite:r,errorOnExist:true,preserveTimestamps:true};o(e,t,n);return c(e)}e.exports=moveSync},980:(e,t,r)=>{"use strict";const n=r(357);const i=r(17);const{copy:o}=r(798);const{remove:c}=r(373);const{mkdirp:s}=r(933);const{pathExists:a}=r(932);const u=r(470);async function move(e,t,r={}){const n=r.overwrite||r.clobber||false;const{srcStat:o,isChangingCase:c=false}=await u.checkPaths(e,t,"move",r);await u.checkParentPaths(e,o,t,"move");const a=i.dirname(t);const f=i.parse(a);if(f.root!==a){await s(a)}return doRename(e,t,n,c)}async function doRename(e,t,r,i){if(!i){if(r){await c(t)}else if(await a(t)){throw new Error("dest already exists.")}}try{await n.rename(e,t)}catch(n){if(n.code!=="EXDEV"){throw n}await moveAcrossDevice(e,t,r)}}async function moveAcrossDevice(e,t,r){const n={overwrite:r,errorOnExist:true,preserveTimestamps:true};await o(e,t,n);return c(e)}e.exports=move},693:(e,t,r)=>{"use strict";const n=r(469).fromPromise;const i=r(357);const o=r(17);const c=r(933);const s=r(932).pathExists;async function outputFile(e,t,r="utf-8"){const n=o.dirname(e);if(!await s(n)){await c.mkdirs(n)}return i.writeFile(e,t,r)}function outputFileSync(e,...t){const r=o.dirname(e);if(!i.existsSync(r)){c.mkdirsSync(r)}i.writeFileSync(e,...t)}e.exports={outputFile:n(outputFile),outputFileSync:outputFileSync}},932:(e,t,r)=>{"use strict";const n=r(469).fromPromise;const i=r(357);function pathExists(e){return i.access(e).then((()=>true)).catch((()=>false))}e.exports={pathExists:n(pathExists),pathExistsSync:i.existsSync}},373:(e,t,r)=>{"use strict";const n=r(796);const i=r(469).fromCallback;function remove(e,t){n.rm(e,{recursive:true,force:true},t)}function removeSync(e){n.rmSync(e,{recursive:true,force:true})}e.exports={remove:i(remove),removeSync:removeSync}},470:(e,t,r)=>{"use strict";const n=r(357);const i=r(17);const o=r(469).fromPromise;function getStats(e,t,r){const i=r.dereference?e=>n.stat(e,{bigint:true}):e=>n.lstat(e,{bigint:true});return Promise.all([i(e),i(t).catch((e=>{if(e.code==="ENOENT")return null;throw e}))]).then((([e,t])=>({srcStat:e,destStat:t})))}function getStatsSync(e,t,r){let i;const o=r.dereference?e=>n.statSync(e,{bigint:true}):e=>n.lstatSync(e,{bigint:true});const c=o(e);try{i=o(t)}catch(e){if(e.code==="ENOENT")return{srcStat:c,destStat:null};throw e}return{srcStat:c,destStat:i}}async function checkPaths(e,t,r,n){const{srcStat:o,destStat:c}=await getStats(e,t,n);if(c){if(areIdentical(o,c)){const n=i.basename(e);const s=i.basename(t);if(r==="move"&&n!==s&&n.toLowerCase()===s.toLowerCase()){return{srcStat:o,destStat:c,isChangingCase:true}}throw new Error("Source and destination must not be the same.")}if(o.isDirectory()&&!c.isDirectory()){throw new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`)}if(!o.isDirectory()&&c.isDirectory()){throw new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`)}}if(o.isDirectory()&&isSrcSubdir(e,t)){throw new Error(errMsg(e,t,r))}return{srcStat:o,destStat:c}}function checkPathsSync(e,t,r,n){const{srcStat:o,destStat:c}=getStatsSync(e,t,n);if(c){if(areIdentical(o,c)){const n=i.basename(e);const s=i.basename(t);if(r==="move"&&n!==s&&n.toLowerCase()===s.toLowerCase()){return{srcStat:o,destStat:c,isChangingCase:true}}throw new Error("Source and destination must not be the same.")}if(o.isDirectory()&&!c.isDirectory()){throw new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`)}if(!o.isDirectory()&&c.isDirectory()){throw new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`)}}if(o.isDirectory()&&isSrcSubdir(e,t)){throw new Error(errMsg(e,t,r))}return{srcStat:o,destStat:c}}async function checkParentPaths(e,t,r,o){const c=i.resolve(i.dirname(e));const s=i.resolve(i.dirname(r));if(s===c||s===i.parse(s).root)return;let a;try{a=await n.stat(s,{bigint:true})}catch(e){if(e.code==="ENOENT")return;throw e}if(areIdentical(t,a)){throw new Error(errMsg(e,r,o))}return checkParentPaths(e,t,s,o)}function checkParentPathsSync(e,t,r,o){const c=i.resolve(i.dirname(e));const s=i.resolve(i.dirname(r));if(s===c||s===i.parse(s).root)return;let a;try{a=n.statSync(s,{bigint:true})}catch(e){if(e.code==="ENOENT")return;throw e}if(areIdentical(t,a)){throw new Error(errMsg(e,r,o))}return checkParentPathsSync(e,t,s,o)}function areIdentical(e,t){return t.ino&&t.dev&&t.ino===e.ino&&t.dev===e.dev}function isSrcSubdir(e,t){const r=i.resolve(e).split(i.sep).filter((e=>e));const n=i.resolve(t).split(i.sep).filter((e=>e));return r.every(((e,t)=>n[t]===e))}function errMsg(e,t,r){return`Cannot ${r} '${e}' to a subdirectory of itself, '${t}'.`}e.exports={checkPaths:o(checkPaths),checkPathsSync:checkPathsSync,checkParentPaths:o(checkParentPaths),checkParentPathsSync:checkParentPathsSync,isSrcSubdir:isSrcSubdir,areIdentical:areIdentical}},651:(e,t,r)=>{"use strict";const n=r(357);const i=r(469).fromPromise;async function utimesMillis(e,t,r){const i=await n.open(e,"r+");let o=null;try{await n.futimes(i,t,r)}finally{try{await n.close(i)}catch(e){o=e}}if(o){throw o}}function utimesMillisSync(e,t,r){const i=n.openSync(e,"r+");n.futimesSync(i,t,r);return n.closeSync(i)}e.exports={utimesMillis:i(utimesMillis),utimesMillisSync:utimesMillisSync}},534:e=>{"use strict";e.exports=clone;var t=Object.getPrototypeOf||function(e){return e.__proto__};function clone(e){if(e===null||typeof e!=="object")return e;if(e instanceof Object)var r={__proto__:t(e)};else var r=Object.create(null);Object.getOwnPropertyNames(e).forEach((function(t){Object.defineProperty(r,t,Object.getOwnPropertyDescriptor(e,t))}));return r}},796:(e,t,r)=>{var n=r(147);var i=r(50);var o=r(318);var c=r(534);var s=r(837);var a;var u;if(typeof Symbol==="function"&&typeof Symbol.for==="function"){a=Symbol.for("graceful-fs.queue");u=Symbol.for("graceful-fs.previous")}else{a="___graceful-fs.queue";u="___graceful-fs.previous"}function noop(){}function publishQueue(e,t){Object.defineProperty(e,a,{get:function(){return t}})}var f=noop;if(s.debuglog)f=s.debuglog("gfs4");else if(/\bgfs4\b/i.test(process.env.NODE_DEBUG||""))f=function(){var e=s.format.apply(s,arguments);e="GFS4: "+e.split(/\n/).join("\nGFS4: ");console.error(e)};if(!n[a]){var l=global[a]||[];publishQueue(n,l);n.close=function(e){function close(t,r){return e.call(n,t,(function(e){if(!e){resetQueue()}if(typeof r==="function")r.apply(this,arguments)}))}Object.defineProperty(close,u,{value:e});return close}(n.close);n.closeSync=function(e){function closeSync(t){e.apply(n,arguments);resetQueue()}Object.defineProperty(closeSync,u,{value:e});return closeSync}(n.closeSync);if(/\bgfs4\b/i.test(process.env.NODE_DEBUG||"")){process.on("exit",(function(){f(n[a]);r(491).equal(n[a].length,0)}))}}if(!global[a]){publishQueue(global,n[a])}e.exports=patch(c(n));if(process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH&&!n.__patched){e.exports=patch(n);n.__patched=true}function patch(e){i(e);e.gracefulify=patch;e.createReadStream=createReadStream;e.createWriteStream=createWriteStream;var t=e.readFile;e.readFile=readFile;function readFile(e,r,n){if(typeof r==="function")n=r,r=null;return go$readFile(e,r,n);function go$readFile(e,r,n,i){return t(e,r,(function(t){if(t&&(t.code==="EMFILE"||t.code==="ENFILE"))enqueue([go$readFile,[e,r,n],t,i||Date.now(),Date.now()]);else{if(typeof n==="function")n.apply(this,arguments)}}))}}var r=e.writeFile;e.writeFile=writeFile;function writeFile(e,t,n,i){if(typeof n==="function")i=n,n=null;return go$writeFile(e,t,n,i);function go$writeFile(e,t,n,i,o){return r(e,t,n,(function(r){if(r&&(r.code==="EMFILE"||r.code==="ENFILE"))enqueue([go$writeFile,[e,t,n,i],r,o||Date.now(),Date.now()]);else{if(typeof i==="function")i.apply(this,arguments)}}))}}var n=e.appendFile;if(n)e.appendFile=appendFile;function appendFile(e,t,r,i){if(typeof r==="function")i=r,r=null;return go$appendFile(e,t,r,i);function go$appendFile(e,t,r,i,o){return n(e,t,r,(function(n){if(n&&(n.code==="EMFILE"||n.code==="ENFILE"))enqueue([go$appendFile,[e,t,r,i],n,o||Date.now(),Date.now()]);else{if(typeof i==="function")i.apply(this,arguments)}}))}}var c=e.copyFile;if(c)e.copyFile=copyFile;function copyFile(e,t,r,n){if(typeof r==="function"){n=r;r=0}return go$copyFile(e,t,r,n);function go$copyFile(e,t,r,n,i){return c(e,t,r,(function(o){if(o&&(o.code==="EMFILE"||o.code==="ENFILE"))enqueue([go$copyFile,[e,t,r,n],o,i||Date.now(),Date.now()]);else{if(typeof n==="function")n.apply(this,arguments)}}))}}var s=e.readdir;e.readdir=readdir;var a=/^v[0-5]\./;function readdir(e,t,r){if(typeof t==="function")r=t,t=null;var n=a.test(process.version)?function go$readdir(e,t,r,n){return s(e,fs$readdirCallback(e,t,r,n))}:function go$readdir(e,t,r,n){return s(e,t,fs$readdirCallback(e,t,r,n))};return n(e,t,r);function fs$readdirCallback(e,t,r,i){return function(o,c){if(o&&(o.code==="EMFILE"||o.code==="ENFILE"))enqueue([n,[e,t,r],o,i||Date.now(),Date.now()]);else{if(c&&c.sort)c.sort();if(typeof r==="function")r.call(this,o,c)}}}}if(process.version.substr(0,4)==="v0.8"){var u=o(e);ReadStream=u.ReadStream;WriteStream=u.WriteStream}var f=e.ReadStream;if(f){ReadStream.prototype=Object.create(f.prototype);ReadStream.prototype.open=ReadStream$open}var l=e.WriteStream;if(l){WriteStream.prototype=Object.create(l.prototype);WriteStream.prototype.open=WriteStream$open}Object.defineProperty(e,"ReadStream",{get:function(){return ReadStream},set:function(e){ReadStream=e},enumerable:true,configurable:true});Object.defineProperty(e,"WriteStream",{get:function(){return WriteStream},set:function(e){WriteStream=e},enumerable:true,configurable:true});var y=ReadStream;Object.defineProperty(e,"FileReadStream",{get:function(){return y},set:function(e){y=e},enumerable:true,configurable:true});var p=WriteStream;Object.defineProperty(e,"FileWriteStream",{get:function(){return p},set:function(e){p=e},enumerable:true,configurable:true});function ReadStream(e,t){if(this instanceof ReadStream)return f.apply(this,arguments),this;else return ReadStream.apply(Object.create(ReadStream.prototype),arguments)}function ReadStream$open(){var e=this;open(e.path,e.flags,e.mode,(function(t,r){if(t){if(e.autoClose)e.destroy();e.emit("error",t)}else{e.fd=r;e.emit("open",r);e.read()}}))}function WriteStream(e,t){if(this instanceof WriteStream)return l.apply(this,arguments),this;else return WriteStream.apply(Object.create(WriteStream.prototype),arguments)}function WriteStream$open(){var e=this;open(e.path,e.flags,e.mode,(function(t,r){if(t){e.destroy();e.emit("error",t)}else{e.fd=r;e.emit("open",r)}}))}function createReadStream(t,r){return new e.ReadStream(t,r)}function createWriteStream(t,r){return new e.WriteStream(t,r)}var m=e.open;e.open=open;function open(e,t,r,n){if(typeof r==="function")n=r,r=null;return go$open(e,t,r,n);function go$open(e,t,r,n,i){return m(e,t,r,(function(o,c){if(o&&(o.code==="EMFILE"||o.code==="ENFILE"))enqueue([go$open,[e,t,r,n],o,i||Date.now(),Date.now()]);else{if(typeof n==="function")n.apply(this,arguments)}}))}}return e}function enqueue(e){f("ENQUEUE",e[0].name,e[1]);n[a].push(e);retry()}var y;function resetQueue(){var e=Date.now();for(var t=0;t<n[a].length;++t){if(n[a][t].length>2){n[a][t][3]=e;n[a][t][4]=e}}retry()}function retry(){clearTimeout(y);y=undefined;if(n[a].length===0)return;var e=n[a].shift();var t=e[0];var r=e[1];var i=e[2];var o=e[3];var c=e[4];if(o===undefined){f("RETRY",t.name,r);t.apply(null,r)}else if(Date.now()-o>=6e4){f("TIMEOUT",t.name,r);var s=r.pop();if(typeof s==="function")s.call(null,i)}else{var u=Date.now()-c;var l=Math.max(c-o,1);var p=Math.min(l*1.2,100);if(u>=p){f("RETRY",t.name,r);t.apply(null,r.concat([o]))}else{n[a].push(e)}}if(y===undefined){y=setTimeout(retry,0)}}},318:(e,t,r)=>{var n=r(781).Stream;e.exports=legacy;function legacy(e){return{ReadStream:ReadStream,WriteStream:WriteStream};function ReadStream(t,r){if(!(this instanceof ReadStream))return new ReadStream(t,r);n.call(this);var i=this;this.path=t;this.fd=null;this.readable=true;this.paused=false;this.flags="r";this.mode=438;this.bufferSize=64*1024;r=r||{};var o=Object.keys(r);for(var c=0,s=o.length;c<s;c++){var a=o[c];this[a]=r[a]}if(this.encoding)this.setEncoding(this.encoding);if(this.start!==undefined){if("number"!==typeof this.start){throw TypeError("start must be a Number")}if(this.end===undefined){this.end=Infinity}else if("number"!==typeof this.end){throw TypeError("end must be a Number")}if(this.start>this.end){throw new Error("start must be <= end")}this.pos=this.start}if(this.fd!==null){process.nextTick((function(){i._read()}));return}e.open(this.path,this.flags,this.mode,(function(e,t){if(e){i.emit("error",e);i.readable=false;return}i.fd=t;i.emit("open",t);i._read()}))}function WriteStream(t,r){if(!(this instanceof WriteStream))return new WriteStream(t,r);n.call(this);this.path=t;this.fd=null;this.writable=true;this.flags="w";this.encoding="binary";this.mode=438;this.bytesWritten=0;r=r||{};var i=Object.keys(r);for(var o=0,c=i.length;o<c;o++){var s=i[o];this[s]=r[s]}if(this.start!==undefined){if("number"!==typeof this.start){throw TypeError("start must be a Number")}if(this.start<0){throw new Error("start must be >= zero")}this.pos=this.start}this.busy=false;this._queue=[];if(this.fd===null){this._open=e.open;this._queue.push([this._open,this.path,this.flags,this.mode,undefined]);this.flush()}}}},50:(e,t,r)=>{var n=r(57);var i=process.cwd;var o=null;var c=process.env.GRACEFUL_FS_PLATFORM||process.platform;process.cwd=function(){if(!o)o=i.call(process);return o};try{process.cwd()}catch(e){}if(typeof process.chdir==="function"){var s=process.chdir;process.chdir=function(e){o=null;s.call(process,e)};if(Object.setPrototypeOf)Object.setPrototypeOf(process.chdir,s)}e.exports=patch;function patch(e){if(n.hasOwnProperty("O_SYMLINK")&&process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)){patchLchmod(e)}if(!e.lutimes){patchLutimes(e)}e.chown=chownFix(e.chown);e.fchown=chownFix(e.fchown);e.lchown=chownFix(e.lchown);e.chmod=chmodFix(e.chmod);e.fchmod=chmodFix(e.fchmod);e.lchmod=chmodFix(e.lchmod);e.chownSync=chownFixSync(e.chownSync);e.fchownSync=chownFixSync(e.fchownSync);e.lchownSync=chownFixSync(e.lchownSync);e.chmodSync=chmodFixSync(e.chmodSync);e.fchmodSync=chmodFixSync(e.fchmodSync);e.lchmodSync=chmodFixSync(e.lchmodSync);e.stat=statFix(e.stat);e.fstat=statFix(e.fstat);e.lstat=statFix(e.lstat);e.statSync=statFixSync(e.statSync);e.fstatSync=statFixSync(e.fstatSync);e.lstatSync=statFixSync(e.lstatSync);if(e.chmod&&!e.lchmod){e.lchmod=function(e,t,r){if(r)process.nextTick(r)};e.lchmodSync=function(){}}if(e.chown&&!e.lchown){e.lchown=function(e,t,r,n){if(n)process.nextTick(n)};e.lchownSync=function(){}}if(c==="win32"){e.rename=typeof e.rename!=="function"?e.rename:function(t){function rename(r,n,i){var o=Date.now();var c=0;t(r,n,(function CB(s){if(s&&(s.code==="EACCES"||s.code==="EPERM"||s.code==="EBUSY")&&Date.now()-o<6e4){setTimeout((function(){e.stat(n,(function(e,o){if(e&&e.code==="ENOENT")t(r,n,CB);else i(s)}))}),c);if(c<100)c+=10;return}if(i)i(s)}))}if(Object.setPrototypeOf)Object.setPrototypeOf(rename,t);return rename}(e.rename)}e.read=typeof e.read!=="function"?e.read:function(t){function read(r,n,i,o,c,s){var a;if(s&&typeof s==="function"){var u=0;a=function(f,l,y){if(f&&f.code==="EAGAIN"&&u<10){u++;return t.call(e,r,n,i,o,c,a)}s.apply(this,arguments)}}return t.call(e,r,n,i,o,c,a)}if(Object.setPrototypeOf)Object.setPrototypeOf(read,t);return read}(e.read);e.readSync=typeof e.readSync!=="function"?e.readSync:function(t){return function(r,n,i,o,c){var s=0;while(true){try{return t.call(e,r,n,i,o,c)}catch(e){if(e.code==="EAGAIN"&&s<10){s++;continue}throw e}}}}(e.readSync);function patchLchmod(e){e.lchmod=function(t,r,i){e.open(t,n.O_WRONLY|n.O_SYMLINK,r,(function(t,n){if(t){if(i)i(t);return}e.fchmod(n,r,(function(t){e.close(n,(function(e){if(i)i(t||e)}))}))}))};e.lchmodSync=function(t,r){var i=e.openSync(t,n.O_WRONLY|n.O_SYMLINK,r);var o=true;var c;try{c=e.fchmodSync(i,r);o=false}finally{if(o){try{e.closeSync(i)}catch(e){}}else{e.closeSync(i)}}return c}}function patchLutimes(e){if(n.hasOwnProperty("O_SYMLINK")&&e.futimes){e.lutimes=function(t,r,i,o){e.open(t,n.O_SYMLINK,(function(t,n){if(t){if(o)o(t);return}e.futimes(n,r,i,(function(t){e.close(n,(function(e){if(o)o(t||e)}))}))}))};e.lutimesSync=function(t,r,i){var o=e.openSync(t,n.O_SYMLINK);var c;var s=true;try{c=e.futimesSync(o,r,i);s=false}finally{if(s){try{e.closeSync(o)}catch(e){}}else{e.closeSync(o)}}return c}}else if(e.futimes){e.lutimes=function(e,t,r,n){if(n)process.nextTick(n)};e.lutimesSync=function(){}}}function chmodFix(t){if(!t)return t;return function(r,n,i){return t.call(e,r,n,(function(e){if(chownErOk(e))e=null;if(i)i.apply(this,arguments)}))}}function chmodFixSync(t){if(!t)return t;return function(r,n){try{return t.call(e,r,n)}catch(e){if(!chownErOk(e))throw e}}}function chownFix(t){if(!t)return t;return function(r,n,i,o){return t.call(e,r,n,i,(function(e){if(chownErOk(e))e=null;if(o)o.apply(this,arguments)}))}}function chownFixSync(t){if(!t)return t;return function(r,n,i){try{return t.call(e,r,n,i)}catch(e){if(!chownErOk(e))throw e}}}function statFix(t){if(!t)return t;return function(r,n,i){if(typeof n==="function"){i=n;n=null}function callback(e,t){if(t){if(t.uid<0)t.uid+=4294967296;if(t.gid<0)t.gid+=4294967296}if(i)i.apply(this,arguments)}return n?t.call(e,r,n,callback):t.call(e,r,callback)}}function statFixSync(t){if(!t)return t;return function(r,n){var i=n?t.call(e,r,n):t.call(e,r);if(i){if(i.uid<0)i.uid+=4294967296;if(i.gid<0)i.gid+=4294967296}return i}}function chownErOk(e){if(!e)return true;if(e.code==="ENOSYS")return true;var t=!process.getuid||process.getuid()!==0;if(t){if(e.code==="EINVAL"||e.code==="EPERM")return true}return false}}},313:(e,t,r)=>{let n;try{n=r(796)}catch(e){n=r(147)}const i=r(469);const{stringify:o,stripBom:c}=r(6);async function _readFile(e,t={}){if(typeof t==="string"){t={encoding:t}}const r=t.fs||n;const o="throws"in t?t.throws:true;let s=await i.fromCallback(r.readFile)(e,t);s=c(s);let a;try{a=JSON.parse(s,t?t.reviver:null)}catch(t){if(o){t.message=`${e}: ${t.message}`;throw t}else{return null}}return a}const s=i.fromPromise(_readFile);function readFileSync(e,t={}){if(typeof t==="string"){t={encoding:t}}const r=t.fs||n;const i="throws"in t?t.throws:true;try{let n=r.readFileSync(e,t);n=c(n);return JSON.parse(n,t.reviver)}catch(t){if(i){t.message=`${e}: ${t.message}`;throw t}else{return null}}}async function _writeFile(e,t,r={}){const c=r.fs||n;const s=o(t,r);await i.fromCallback(c.writeFile)(e,s,r)}const a=i.fromPromise(_writeFile);function writeFileSync(e,t,r={}){const i=r.fs||n;const c=o(t,r);return i.writeFileSync(e,c,r)}const u={readFile:s,readFileSync:readFileSync,writeFile:a,writeFileSync:writeFileSync};e.exports=u},6:e=>{function stringify(e,{EOL:t="\n",finalEOL:r=true,replacer:n=null,spaces:i}={}){const o=r?t:"";const c=JSON.stringify(e,n,i);return c.replace(/\n/g,t)+o}function stripBom(e){if(Buffer.isBuffer(e))e=e.toString("utf8");return e.replace(/^\uFEFF/,"")}e.exports={stringify:stringify,stripBom:stripBom}},469:(e,t)=>{"use strict";t.fromCallback=function(e){return Object.defineProperty((function(...t){if(typeof t[t.length-1]==="function")e.apply(this,t);else{return new Promise(((r,n)=>{e.call(this,...t,((e,t)=>e!=null?n(e):r(t)))}))}}),"name",{value:e.name})};t.fromPromise=function(e){return Object.defineProperty((function(...t){const r=t[t.length-1];if(typeof r!=="function")return e.apply(this,t);else e.apply(this,t.slice(0,-1)).then((e=>r(null,e)),r)}),"name",{value:e.name})}},491:e=>{"use strict";e.exports=require("assert")},57:e=>{"use strict";e.exports=require("constants")},147:e=>{"use strict";e.exports=require("fs")},17:e=>{"use strict";e.exports=require("path")},781:e=>{"use strict";e.exports=require("stream")},837:e=>{"use strict";e.exports=require("util")}};var t={};function __nccwpck_require__(r){var n=t[r];if(n!==undefined){return n.exports}var i=t[r]={exports:{}};var o=true;try{e[r](i,i.exports,__nccwpck_require__);o=false}finally{if(o)delete t[r]}return i.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var r=__nccwpck_require__(921);module.exports=r})();