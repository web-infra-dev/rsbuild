/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 693:
/***/ ((module) => {



// * /
// *   (\\)?            # is it escaped with a backslash?
// *   (\$)             # literal $
// *   (?!\()           # shouldnt be followed by parenthesis
// *   (\{?)            # first brace wrap opening
// *   ([\w.]+)         # key
// *   (?::-((?:\$\{(?:\$\{(?:\$\{[^}]*\}|[^}])*}|[^}])*}|[^}])+))? # optional default nested 3 times
// *   (\}?)            # last brace warp closing
// * /xi

const DOTENV_SUBSTITUTION_REGEX = /(\\)?(\$)(?!\()(\{?)([\w.]+)(?::?-((?:\$\{(?:\$\{(?:\$\{[^}]*\}|[^}])*}|[^}])*}|[^}])+))?(\}?)/gi

function _resolveEscapeSequences (value) {
  return value.replace(/\\\$/g, '$')
}

function interpolate (value, processEnv, parsed) {
  return value.replace(DOTENV_SUBSTITUTION_REGEX, (match, escaped, dollarSign, openBrace, key, defaultValue, closeBrace) => {
    if (escaped === '\\') {
      return match.slice(1)
    } else {
      if (processEnv[key]) {
        if (processEnv[key] === parsed[key]) {
          return processEnv[key]
        } else {
          // scenario: PASSWORD_EXPAND_NESTED=${PASSWORD_EXPAND}
          return interpolate(processEnv[key], processEnv, parsed)
        }
      }

      if (parsed[key]) {
        // avoid recursion from EXPAND_SELF=$EXPAND_SELF
        if (parsed[key] === value) {
          return parsed[key]
        } else {
          return interpolate(parsed[key], processEnv, parsed)
        }
      }

      if (defaultValue) {
        if (defaultValue.startsWith('$')) {
          return interpolate(defaultValue, processEnv, parsed)
        } else {
          return defaultValue
        }
      }

      return ''
    }
  })
}

function expand (options) {
  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }

  for (const key in options.parsed) {
    let value = options.parsed[key]

    const inProcessEnv = Object.prototype.hasOwnProperty.call(processEnv, key)
    if (inProcessEnv) {
      if (processEnv[key] === options.parsed[key]) {
        // assume was set to processEnv from the .env file if the values match and therefore interpolate
        value = interpolate(value, processEnv, options.parsed)
      } else {
        // do not interpolate - assume processEnv had the intended value even if containing a $.
        value = processEnv[key]
      }
    } else {
      // not inProcessEnv so assume interpolation for this .env key
      value = interpolate(value, processEnv, options.parsed)
    }

    options.parsed[key] = _resolveEscapeSequences(value)
  }

  for (const processKey in options.parsed) {
    processEnv[processKey] = options.parsed[processKey]
  }

  return options
}

module.exports.expand = expand


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
/******/ 	// This entry module used 'module' so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(693);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;