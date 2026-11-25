import cssText from './index.css';

(globalThis as Record<string, unknown>).__cssText = cssText;
