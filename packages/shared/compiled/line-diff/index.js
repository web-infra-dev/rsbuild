(()=>{var e={791:e=>{e.exports=function(e,r){var i=[];var n=e.length;var t=r.length;if(n==0)return t;if(t==0)return n;for(var a=n;a>=0;a--)i[a]=[];for(var a=n;a>=0;a--)i[a][0]=a;for(var f=t;f>=0;f--)i[0][f]=f;for(var a=1;a<=n;a++){var o=e.charAt(a-1);for(var f=1;f<=t;f++){if(a==f&&i[a][f]>4)return n;var s=r.charAt(f-1);var u=o==s?0:1;var c=i[a-1][f]+1;var v=i[a][f-1]+1;var _=i[a-1][f-1]+u;if(v<c)c=v;if(_<c)c=_;i[a][f]=c;if(a>1&&f>1&&o==r.charAt(f-2)&&e.charAt(a-2)==s){i[a][f]=Math.min(i[a][f],i[a-2][f-2]+u)}}}return i[n][t]}},632:(e,r,i)=>{"use strict";var n=function(){function defineProperties(e,r){for(var i=0;i<r.length;i++){var n=r[i];n.enumerable=n.enumerable||false;n.configurable=true;if("value"in n)n.writable=true;Object.defineProperty(e,n.key,n)}}return function(e,r,i){if(r)defineProperties(e.prototype,r);if(i)defineProperties(e,i);return e}}();function _classCallCheck(e,r){if(!(e instanceof r)){throw new TypeError("Cannot call a class as a function")}}var t=i(791);var a=
/*!
 * Change
 * This is used for comparing two lines.
 *
 * @name Change
 * @function
 * @param {String} oldLine The old line value.
 * @param {String} addedLine The new line.
 * @param {Number} sensitivity The diff sensitivity.
 * @return {Change} The `Change` object:
 *
 *  - `_` (Array): An array with the old line and the new line.
 *  - `changes` (Number): How many changes are there, calculated with the levenshtein distance algorithm.
 *  - `modified` (Boolean): A boolean value representing if the old line was modified or not.
 */
function Change(e,r,i,n){_classCallCheck(this,Change);this._=[e,r];this.changes=t(e,r);this.modified=this.changes>i;this.lineno=n};var f=function(){function Diff(e,r,i){var n=this;_classCallCheck(this,Diff);this.sensitivity=i||0;this.changes=[];e=typeof e==="string"?e.split("\n"):e;r=typeof r==="string"?r.split("\n"):r;this.old_lines=e;this.new_lines=r;var t=null;r.forEach((function(r,i){t=e[i]||"";n.changes.push(new a(t,r,n.sensitivity,i+1))}))}n(Diff,[{key:"toString",value:function toString(){var e="",r={added:"",removed:""};this.changes.forEach((function(i){if(!i.modified){e+=r.removed;e+=r.added;r.removed="";r.added="";e+="   "+i._[1]+"\n"}else{r.removed+=" - "+i._[0]+"\n";if(i._[1]){r.added+=" + "+i._[1]+"\n"}}}));e+=r.removed;e+=r.added;return e}}]);return Diff}();e.exports=f}};var r={};function __nccwpck_require__(i){var n=r[i];if(n!==undefined){return n.exports}var t=r[i]={exports:{}};var a=true;try{e[i](t,t.exports,__nccwpck_require__);a=false}finally{if(a)delete r[i]}return t.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var i=__nccwpck_require__(632);module.exports=i})();