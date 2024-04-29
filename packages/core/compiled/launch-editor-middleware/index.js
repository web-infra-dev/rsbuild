/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 426:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const url = __nccwpck_require__(310)
const path = __nccwpck_require__(17)
const launch = __nccwpck_require__(80)

module.exports = (specifiedEditor, srcRoot, onErrorCallback) => {
  if (typeof specifiedEditor === 'function') {
    onErrorCallback = specifiedEditor
    specifiedEditor = undefined
  }

  if (typeof srcRoot === 'function') {
    onErrorCallback = srcRoot
    srcRoot = undefined
  }

  srcRoot = srcRoot || process.cwd()

  return function launchEditorMiddleware (req, res, next) {
    const { file } = url.parse(req.url, true).query || {}
    if (!file) {
      res.statusCode = 500
      res.end(`launch-editor-middleware: required query param "file" is missing.`)
    } else {
      launch(path.resolve(srcRoot, file), specifiedEditor, onErrorCallback)
      res.end()
    }
  }
}


/***/ }),

/***/ 881:
/***/ ((module) => {

module.exports = {
  atom: 'atom',
  Brackets: 'brackets',
  'code-insiders': 'code-insiders',
  code: 'code',
  vscodium: 'vscodium',
  codium: 'codium',
  emacs: 'emacs',
  gvim: 'gvim',
  'idea.sh': 'idea',
  'phpstorm.sh': 'phpstorm',
  'pycharm.sh': 'pycharm',
  'rubymine.sh': 'rubymine',
  sublime_text: 'subl',
  vim: 'vim',
  'webstorm.sh': 'webstorm',
  'goland.sh': 'goland',
  'rider.sh': 'rider'
}


/***/ }),

/***/ 341:
/***/ ((module) => {

module.exports = {
  '/Applications/Atom.app/Contents/MacOS/Atom': 'atom',
  '/Applications/Atom Beta.app/Contents/MacOS/Atom Beta':
    '/Applications/Atom Beta.app/Contents/MacOS/Atom Beta',
  '/Applications/Brackets.app/Contents/MacOS/Brackets': 'brackets',
  '/Applications/Sublime Text.app/Contents/MacOS/Sublime Text':
    '/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl',
  '/Applications/Sublime Text.app/Contents/MacOS/sublime_text':
    '/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl',
  '/Applications/Sublime Text 2.app/Contents/MacOS/Sublime Text 2':
    '/Applications/Sublime Text 2.app/Contents/SharedSupport/bin/subl',
  '/Applications/Sublime Text Dev.app/Contents/MacOS/Sublime Text':
    '/Applications/Sublime Text Dev.app/Contents/SharedSupport/bin/subl',
  '/Applications/Visual Studio Code.app/Contents/MacOS/Electron': 'code',
  '/Applications/Visual Studio Code - Insiders.app/Contents/MacOS/Electron':
    'code-insiders',
  '/Applications/VSCodium.app/Contents/MacOS/Electron': 'codium',
  '/Applications/AppCode.app/Contents/MacOS/appcode':
    '/Applications/AppCode.app/Contents/MacOS/appcode',
  '/Applications/CLion.app/Contents/MacOS/clion':
    '/Applications/CLion.app/Contents/MacOS/clion',
  '/Applications/IntelliJ IDEA.app/Contents/MacOS/idea':
    '/Applications/IntelliJ IDEA.app/Contents/MacOS/idea',
  '/Applications/PhpStorm.app/Contents/MacOS/phpstorm':
    '/Applications/PhpStorm.app/Contents/MacOS/phpstorm',
  '/Applications/PyCharm.app/Contents/MacOS/pycharm':
    '/Applications/PyCharm.app/Contents/MacOS/pycharm',
  '/Applications/PyCharm CE.app/Contents/MacOS/pycharm':
    '/Applications/PyCharm CE.app/Contents/MacOS/pycharm',
  '/Applications/RubyMine.app/Contents/MacOS/rubymine':
    '/Applications/RubyMine.app/Contents/MacOS/rubymine',
  '/Applications/WebStorm.app/Contents/MacOS/webstorm':
    '/Applications/WebStorm.app/Contents/MacOS/webstorm',
  '/Applications/MacVim.app/Contents/MacOS/MacVim': 'mvim',
  '/Applications/GoLand.app/Contents/MacOS/goland':
    '/Applications/GoLand.app/Contents/MacOS/goland',
  '/Applications/Rider.app/Contents/MacOS/rider':
    '/Applications/Rider.app/Contents/MacOS/rider'
}


/***/ }),

/***/ 3:
/***/ ((module) => {

module.exports = [
  'Brackets.exe',
  'Code.exe',
  'Code - Insiders.exe',
  'VSCodium.exe',
  'atom.exe',
  'sublime_text.exe',
  'notepad++.exe',
  'clion.exe',
  'clion64.exe',
  'idea.exe',
  'idea64.exe',
  'phpstorm.exe',
  'phpstorm64.exe',
  'pycharm.exe',
  'pycharm64.exe',
  'rubymine.exe',
  'rubymine64.exe',
  'webstorm.exe',
  'webstorm64.exe',
  'goland.exe',
  'goland64.exe',
  'rider.exe',
  'rider64.exe'
]


/***/ }),

/***/ 417:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const path = __nccwpck_require__(17)

// normalize file/line numbers into command line args for specific editors
module.exports = function getArgumentsForPosition (
  editor,
  fileName,
  lineNumber,
  columnNumber = 1
) {
  const editorBasename = path.basename(editor).replace(/\.(exe|cmd|bat)$/i, '')
  switch (editorBasename) {
    case 'atom':
    case 'Atom':
    case 'Atom Beta':
    case 'subl':
    case 'sublime':
    case 'sublime_text':
    case 'wstorm':
    case 'charm':
      return [`${fileName}:${lineNumber}:${columnNumber}`]
    case 'notepad++':
      return ['-n' + lineNumber, '-c' + columnNumber, fileName]
    case 'vim':
    case 'mvim':
      return [`+call cursor(${lineNumber}, ${columnNumber})`, fileName]
    case 'joe':
    case 'gvim':
      return ['+' + `${lineNumber}`, fileName]
    case 'emacs':
    case 'emacsclient':
      return [`+${lineNumber}:${columnNumber}`, fileName]
    case 'rmate':
    case 'mate':
    case 'mine':
      return ['--line', lineNumber, fileName]
    case 'code':
    case 'Code':
    case 'code-insiders':
    case 'Code - Insiders':
    case 'codium':
    case 'vscodium':
    case 'VSCodium':
      return ['-r', '-g', `${fileName}:${lineNumber}:${columnNumber}`]
    case 'appcode':
    case 'clion':
    case 'clion64':
    case 'idea':
    case 'idea64':
    case 'phpstorm':
    case 'phpstorm64':
    case 'pycharm':
    case 'pycharm64':
    case 'rubymine':
    case 'rubymine64':
    case 'webstorm':
    case 'webstorm64':
    case 'goland':
    case 'goland64':
    case 'rider':
    case 'rider64':
      return ['--line', lineNumber, '--column', columnNumber, fileName]
  }

  if (process.env.LAUNCH_EDITOR) {
    return [fileName, lineNumber, columnNumber]
  }

  // For all others, drop the lineNumber until we have
  // a mapping above, since providing the lineNumber incorrectly
  // can result in errors or confusing behavior.
  return [fileName]
}


/***/ }),

/***/ 841:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const path = __nccwpck_require__(17)
const shellQuote = __nccwpck_require__(522)
const childProcess = __nccwpck_require__(81)

// Map from full process name to binary that starts the process
// We can't just re-use full process name, because it will spawn a new instance
// of the app every time
const COMMON_EDITORS_OSX = __nccwpck_require__(341)
const COMMON_EDITORS_LINUX = __nccwpck_require__(881)
const COMMON_EDITORS_WIN = __nccwpck_require__(3)

module.exports = function guessEditor (specifiedEditor) {
  if (specifiedEditor) {
    return shellQuote.parse(specifiedEditor)
  }

  if (process.env.LAUNCH_EDITOR) {
    return [process.env.LAUNCH_EDITOR]
  }

  if (process.versions.webcontainer) {
    return [process.env.EDITOR || 'code']
  }

  // We can find out which editor is currently running by:
  // `ps x` on macOS and Linux
  // `Get-Process` on Windows
  try {
    if (process.platform === 'darwin') {
      const output = childProcess
        .execSync('ps x -o comm=', {
          stdio: ['pipe', 'pipe', 'ignore']
        })
        .toString()
      const processNames = Object.keys(COMMON_EDITORS_OSX)
      const processList = output.split('\n')
      for (let i = 0; i < processNames.length; i++) {
        const processName = processNames[i]
        // Find editor by exact match.
        if (output.indexOf(processName) !== -1) {
          return [COMMON_EDITORS_OSX[processName]]
        }
        const processNameWithoutApplications = processName.replace('/Applications', '')
        // Find editor installation not in /Applications.
        if (output.indexOf(processNameWithoutApplications) !== -1) {
          // Use the CLI command if one is specified
          if (processName !== COMMON_EDITORS_OSX[processName]) {
            return [COMMON_EDITORS_OSX[processName]]
          }
          // Use a partial match to find the running process path.  If one is found, use the
          // existing path since it can be running from anywhere.
          const runningProcess = processList.find((procName) => procName.endsWith(processNameWithoutApplications))
          if (runningProcess !== undefined) {
            return [runningProcess]
          }
        }
      }
    } else if (process.platform === 'win32') {
      const output = childProcess
        .execSync(
          'powershell -NoProfile -Command "Get-CimInstance -Query \\"select executablepath from win32_process where executablepath is not null\\" | % { $_.ExecutablePath }"',
          {
            stdio: ['pipe', 'pipe', 'ignore']
          }
        )
        .toString()
      const runningProcesses = output.split('\r\n')
      for (let i = 0; i < runningProcesses.length; i++) {
        const fullProcessPath = runningProcesses[i].trim()
        const shortProcessName = path.basename(fullProcessPath)

        if (COMMON_EDITORS_WIN.indexOf(shortProcessName) !== -1) {
          return [fullProcessPath]
        }
      }
    } else if (process.platform === 'linux') {
      // --no-heading No header line
      // x List all processes owned by you
      // -o comm Need only names column
      const output = childProcess
        .execSync('ps x --no-heading -o comm --sort=comm', {
          stdio: ['pipe', 'pipe', 'ignore']
        })
        .toString()
      const processNames = Object.keys(COMMON_EDITORS_LINUX)
      for (let i = 0; i < processNames.length; i++) {
        const processName = processNames[i]
        if (output.indexOf(processName) !== -1) {
          return [COMMON_EDITORS_LINUX[processName]]
        }
      }
    }
  } catch (error) {
    // Ignore...
  }

  // Last resort, use old skool env vars
  if (process.env.VISUAL) {
    return [process.env.VISUAL]
  } else if (process.env.EDITOR) {
    return [process.env.EDITOR]
  }

  return [null]
}


/***/ }),

/***/ 80:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/facebookincubator/create-react-app/blob/master/LICENSE
 *
 * Modified by Yuxi Evan You
 */

const fs = __nccwpck_require__(147)
const os = __nccwpck_require__(37)
const path = __nccwpck_require__(17)
const colors = __nccwpck_require__(802)
const childProcess = __nccwpck_require__(81)

const guessEditor = __nccwpck_require__(841)
const getArgumentsForPosition = __nccwpck_require__(417)

function wrapErrorCallback (cb) {
  return (fileName, errorMessage) => {
    console.log()
    console.log(
      colors.red('Could not open ' + path.basename(fileName) + ' in the editor.')
    )
    if (errorMessage) {
      if (errorMessage[errorMessage.length - 1] !== '.') {
        errorMessage += '.'
      }
      console.log(
        colors.red('The editor process exited with an error: ' + errorMessage)
      )
    }
    console.log()
    if (cb) cb(fileName, errorMessage)
  }
}

function isTerminalEditor (editor) {
  switch (editor) {
    case 'vim':
    case 'emacs':
    case 'nano':
      return true
  }
  return false
}

const positionRE = /:(\d+)(:(\d+))?$/
function parseFile (file) {
  const fileName = file.replace(positionRE, '')
  const match = file.match(positionRE)
  const lineNumber = match && match[1]
  const columnNumber = match && match[3]
  return {
    fileName,
    lineNumber,
    columnNumber
  }
}

let _childProcess = null

function launchEditor (file, specifiedEditor, onErrorCallback) {
  const parsed = parseFile(file)
  let { fileName } = parsed
  const { lineNumber, columnNumber } = parsed

  if (!fs.existsSync(fileName)) {
    return
  }

  if (typeof specifiedEditor === 'function') {
    onErrorCallback = specifiedEditor
    specifiedEditor = undefined
  }

  onErrorCallback = wrapErrorCallback(onErrorCallback)

  const [editor, ...args] = guessEditor(specifiedEditor)
  if (!editor) {
    onErrorCallback(fileName, null)
    return
  }

  if (
    process.platform === 'linux' &&
    fileName.startsWith('/mnt/') &&
    /Microsoft/i.test(os.release())
  ) {
    // Assume WSL / "Bash on Ubuntu on Windows" is being used, and
    // that the file exists on the Windows file system.
    // `os.release()` is "4.4.0-43-Microsoft" in the current release
    // build of WSL, see: https://github.com/Microsoft/BashOnWindows/issues/423#issuecomment-221627364
    // When a Windows editor is specified, interop functionality can
    // handle the path translation, but only if a relative path is used.
    fileName = path.relative('', fileName)
  }

  if (lineNumber) {
    const extraArgs = getArgumentsForPosition(editor, fileName, lineNumber, columnNumber)
    args.push.apply(args, extraArgs)
  } else {
    args.push(fileName)
  }

  if (_childProcess && isTerminalEditor(editor)) {
    // There's an existing editor process already and it's attached
    // to the terminal, so go kill it. Otherwise two separate editor
    // instances attach to the stdin/stdout which gets confusing.
    _childProcess.kill('SIGKILL')
  }

  if (process.platform === 'win32') {
    // On Windows, launch the editor in a shell because spawn can only
    // launch .exe files.
    _childProcess = childProcess.spawn(
      'cmd.exe',
      ['/C', editor].concat(args),
      { stdio: 'inherit' }
    )
  } else {
    _childProcess = childProcess.spawn(editor, args, { stdio: 'inherit' })
  }
  _childProcess.on('exit', function (errorCode) {
    _childProcess = null

    if (errorCode) {
      onErrorCallback(fileName, '(code ' + errorCode + ')')
    }
  })

  _childProcess.on('error', function (error) {
    onErrorCallback(fileName, error.message)
  })
}

module.exports = launchEditor


/***/ }),

/***/ 522:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


exports.quote = __nccwpck_require__(392);
exports.parse = __nccwpck_require__(145);


/***/ }),

/***/ 145:
/***/ ((module) => {

"use strict";


// '<(' is process substitution operator and
// can be parsed the same as control operator
var CONTROL = '(?:' + [
	'\\|\\|',
	'\\&\\&',
	';;',
	'\\|\\&',
	'\\<\\(',
	'\\<\\<\\<',
	'>>',
	'>\\&',
	'<\\&',
	'[&;()|<>]'
].join('|') + ')';
var controlRE = new RegExp('^' + CONTROL + '$');
var META = '|&;()<> \\t';
var SINGLE_QUOTE = '"((\\\\"|[^"])*?)"';
var DOUBLE_QUOTE = '\'((\\\\\'|[^\'])*?)\'';
var hash = /^#$/;

var SQ = "'";
var DQ = '"';
var DS = '$';

var TOKEN = '';
var mult = 0x100000000; // Math.pow(16, 8);
for (var i = 0; i < 4; i++) {
	TOKEN += (mult * Math.random()).toString(16);
}
var startsWithToken = new RegExp('^' + TOKEN);

function matchAll(s, r) {
	var origIndex = r.lastIndex;

	var matches = [];
	var matchObj;

	while ((matchObj = r.exec(s))) {
		matches.push(matchObj);
		if (r.lastIndex === matchObj.index) {
			r.lastIndex += 1;
		}
	}

	r.lastIndex = origIndex;

	return matches;
}

function getVar(env, pre, key) {
	var r = typeof env === 'function' ? env(key) : env[key];
	if (typeof r === 'undefined' && key != '') {
		r = '';
	} else if (typeof r === 'undefined') {
		r = '$';
	}

	if (typeof r === 'object') {
		return pre + TOKEN + JSON.stringify(r) + TOKEN;
	}
	return pre + r;
}

function parseInternal(string, env, opts) {
	if (!opts) {
		opts = {};
	}
	var BS = opts.escape || '\\';
	var BAREWORD = '(\\' + BS + '[\'"' + META + ']|[^\\s\'"' + META + '])+';

	var chunker = new RegExp([
		'(' + CONTROL + ')', // control chars
		'(' + BAREWORD + '|' + SINGLE_QUOTE + '|' + DOUBLE_QUOTE + ')+'
	].join('|'), 'g');

	var matches = matchAll(string, chunker);

	if (matches.length === 0) {
		return [];
	}
	if (!env) {
		env = {};
	}

	var commented = false;

	return matches.map(function (match) {
		var s = match[0];
		if (!s || commented) {
			return void undefined;
		}
		if (controlRE.test(s)) {
			return { op: s };
		}

		// Hand-written scanner/parser for Bash quoting rules:
		//
		// 1. inside single quotes, all characters are printed literally.
		// 2. inside double quotes, all characters are printed literally
		//    except variables prefixed by '$' and backslashes followed by
		//    either a double quote or another backslash.
		// 3. outside of any quotes, backslashes are treated as escape
		//    characters and not printed (unless they are themselves escaped)
		// 4. quote context can switch mid-token if there is no whitespace
		//     between the two quote contexts (e.g. all'one'"token" parses as
		//     "allonetoken")
		var quote = false;
		var esc = false;
		var out = '';
		var isGlob = false;
		var i;

		function parseEnvVar() {
			i += 1;
			var varend;
			var varname;
			var char = s.charAt(i);

			if (char === '{') {
				i += 1;
				if (s.charAt(i) === '}') {
					throw new Error('Bad substitution: ' + s.slice(i - 2, i + 1));
				}
				varend = s.indexOf('}', i);
				if (varend < 0) {
					throw new Error('Bad substitution: ' + s.slice(i));
				}
				varname = s.slice(i, varend);
				i = varend;
			} else if ((/[*@#?$!_-]/).test(char)) {
				varname = char;
				i += 1;
			} else {
				var slicedFromI = s.slice(i);
				varend = slicedFromI.match(/[^\w\d_]/);
				if (!varend) {
					varname = slicedFromI;
					i = s.length;
				} else {
					varname = slicedFromI.slice(0, varend.index);
					i += varend.index - 1;
				}
			}
			return getVar(env, '', varname);
		}

		for (i = 0; i < s.length; i++) {
			var c = s.charAt(i);
			isGlob = isGlob || (!quote && (c === '*' || c === '?'));
			if (esc) {
				out += c;
				esc = false;
			} else if (quote) {
				if (c === quote) {
					quote = false;
				} else if (quote == SQ) {
					out += c;
				} else { // Double quote
					if (c === BS) {
						i += 1;
						c = s.charAt(i);
						if (c === DQ || c === BS || c === DS) {
							out += c;
						} else {
							out += BS + c;
						}
					} else if (c === DS) {
						out += parseEnvVar();
					} else {
						out += c;
					}
				}
			} else if (c === DQ || c === SQ) {
				quote = c;
			} else if (controlRE.test(c)) {
				return { op: s };
			} else if (hash.test(c)) {
				commented = true;
				var commentObj = { comment: string.slice(match.index + i + 1) };
				if (out.length) {
					return [out, commentObj];
				}
				return [commentObj];
			} else if (c === BS) {
				esc = true;
			} else if (c === DS) {
				out += parseEnvVar();
			} else {
				out += c;
			}
		}

		if (isGlob) {
			return { op: 'glob', pattern: out };
		}

		return out;
	}).reduce(function (prev, arg) { // finalize parsed arguments
		// TODO: replace this whole reduce with a concat
		return typeof arg === 'undefined' ? prev : prev.concat(arg);
	}, []);
}

module.exports = function parse(s, env, opts) {
	var mapped = parseInternal(s, env, opts);
	if (typeof env !== 'function') {
		return mapped;
	}
	return mapped.reduce(function (acc, s) {
		if (typeof s === 'object') {
			return acc.concat(s);
		}
		var xs = s.split(RegExp('(' + TOKEN + '.*?' + TOKEN + ')', 'g'));
		if (xs.length === 1) {
			return acc.concat(xs[0]);
		}
		return acc.concat(xs.filter(Boolean).map(function (x) {
			if (startsWithToken.test(x)) {
				return JSON.parse(x.split(TOKEN)[1]);
			}
			return x;
		}));
	}, []);
};


/***/ }),

/***/ 392:
/***/ ((module) => {

"use strict";


module.exports = function quote(xs) {
	return xs.map(function (s) {
		if (s && typeof s === 'object') {
			return s.op.replace(/(.)/g, '\\$1');
		}
		if ((/["\s]/).test(s) && !(/'/).test(s)) {
			return "'" + s.replace(/(['\\])/g, '\\$1') + "'";
		}
		if ((/["'\s]/).test(s)) {
			return '"' + s.replace(/(["\\$`!])/g, '\\$1') + '"';
		}
		return String(s).replace(/([A-Za-z]:)?([#!"$&'()*,:;<=>?@[\\\]^`{|}])/g, '$1\\$2');
	}).join(' ');
};


/***/ }),

/***/ 802:
/***/ ((module) => {

"use strict";
module.exports = require("@rsbuild/shared/picocolors");

/***/ }),

/***/ 81:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 37:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 310:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(426);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;