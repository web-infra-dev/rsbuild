/// <reference types="@rspack/core/module" />

/**
 * import.meta
 */
interface ImportMetaEnv {
  [key: string]: any;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Image assets
 */
declare module '*.bmp' {
  const src: string;
  export default src;
}
declare module '*.gif' {
  const src: string;
  export default src;
}
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.jpeg' {
  const src: string;
  export default src;
}
declare module '*.pjpeg' {
  const src: string;
  export default src;
}
declare module '*.pjp' {
  const src: string;
  export default src;
}
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.ico' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.apng' {
  const src: string;
  export default src;
}
declare module '*.avif' {
  const src: string;
  export default src;
}
declare module '*.tif' {
  const src: string;
  export default src;
}
declare module '*.tiff' {
  const src: string;
  export default src;
}
declare module '*.jfif' {
  const src: string;
  export default src;
}

/**
 * Font assets
 */
declare module '*.woff' {
  const src: string;
  export default src;
}
declare module '*.woff2' {
  const src: string;
  export default src;
}
declare module '*.eot' {
  const src: string;
  export default src;
}
declare module '*.ttf' {
  const src: string;
  export default src;
}
declare module '*.otf' {
  const src: string;
  export default src;
}
declare module '*.ttc' {
  const src: string;
  export default src;
}

/**
 * Media assets
 */
declare module '*.mp4' {
  const src: string;
  export default src;
}
declare module '*.webm' {
  const src: string;
  export default src;
}
declare module '*.ogg' {
  const src: string;
  export default src;
}
declare module '*.mp3' {
  const src: string;
  export default src;
}
declare module '*.wav' {
  const src: string;
  export default src;
}
declare module '*.flac' {
  const src: string;
  export default src;
}
declare module '*.aac' {
  const src: string;
  export default src;
}
declare module '*.mov' {
  const src: string;
  export default src;
}
declare module '*.m4a' {
  const src: string;
  export default src;
}
declare module '*.opus' {
  const src: string;
  export default src;
}

/**
 * Configuration files
 */
declare module '*.yaml' {
  const content: Record<string, any>;
  export default content;
}
declare module '*.yml' {
  const content: Record<string, any>;
  export default content;
}
declare module '*.toml' {
  const content: Record<string, any>;
  export default content;
}

/**
 * Queries
 */
declare module '*?url' {
  const content: string;
  export default content;
}
declare module '*?inline' {
  const content: string;
  export default content;
}

/**
 * CSS Modules
 */
type CSSModuleClasses = {
  readonly [key: string]: string;
};
declare module '*.module.css' {
  const classes: CSSModuleClasses;
  export default classes;
}
declare module '*.module.scss' {
  const classes: CSSModuleClasses;
  export default classes;
}
declare module '*.module.sass' {
  const classes: CSSModuleClasses;
  export default classes;
}
declare module '*.module.less' {
  const classes: CSSModuleClasses;
  export default classes;
}
declare module '*.module.styl' {
  const classes: CSSModuleClasses;
  export default classes;
}
declare module '*.module.stylus' {
  const classes: CSSModuleClasses;
  export default classes;
}
