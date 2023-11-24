// If you declare a variable named 'require', esbuild will change it to 'require2'
// Otherwise you use banner to add this code, import.meta.url will be replaced with source file's value by bundle-require
// So we can only add it to global scope, and not pure
import { createRequire } from 'module';

global.require = createRequire(import.meta.url);
