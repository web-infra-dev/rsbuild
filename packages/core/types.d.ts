/**
 * Image assets
 */
declare module '*.bmp' {
  const src: string;
  export default src;
}
declare module '*.bmp?url' {
  const src: string;
  export default src;
}
declare module '*.bmp?inline' {
  const src: string;
  export default src;
}
declare module '*.gif' {
  const src: string;
  export default src;
}
declare module '*.gif?url' {
  const src: string;
  export default src;
}
declare module '*.gif?inline' {
  const src: string;
  export default src;
}
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.jpg?url' {
  const src: string;
  export default src;
}
declare module '*.jpg?inline' {
  const src: string;
  export default src;
}
declare module '*.jpeg' {
  const src: string;
  export default src;
}
declare module '*.jpeg?url' {
  const src: string;
  export default src;
}
declare module '*.jpeg?inline' {
  const src: string;
  export default src;
}
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.png?url' {
  const src: string;
  export default src;
}
declare module '*.png?inline' {
  const src: string;
  export default src;
}
declare module '*.ico' {
  const src: string;
  export default src;
}
declare module '*.ico?url' {
  const src: string;
  export default src;
}
declare module '*.ico?inline' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}
declare module '*.webp?url' {
  const src: string;
  export default src;
}
declare module '*.webp?inline' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.svg?url' {
  const src: string;
  export default src;
}
declare module '*.svg?inline' {
  const src: string;
  export default src;
}
declare module '*.apng' {
  const src: string;
  export default src;
}
declare module '*.apng?url' {
  const src: string;
  export default src;
}
declare module '*.apng?inline' {
  const src: string;
  export default src;
}
declare module '*.avif' {
  const src: string;
  export default src;
}
declare module '*.avif?url' {
  const src: string;
  export default src;
}
declare module '*.avif?inline' {
  const src: string;
  export default src;
}
declare module '*.tiff' {
  const src: string;
  export default src;
}
declare module '*.tiff?url' {
  const src: string;
  export default src;
}
declare module '*.tiff?inline' {
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
declare module '*.woff?url' {
  const src: string;
  export default src;
}
declare module '*.woff?inline' {
  const src: string;
  export default src;
}
declare module '*.woff2' {
  const src: string;
  export default src;
}
declare module '*.woff2?url' {
  const src: string;
  export default src;
}
declare module '*.woff2?inline' {
  const src: string;
  export default src;
}
declare module '*.eot' {
  const src: string;
  export default src;
}
declare module '*.eot?url' {
  const src: string;
  export default src;
}
declare module '*.eot?inline' {
  const src: string;
  export default src;
}
declare module '*.ttf' {
  const src: string;
  export default src;
}
declare module '*.ttf?url' {
  const src: string;
  export default src;
}
declare module '*.ttf?inline' {
  const src: string;
  export default src;
}
declare module '*.otf' {
  const src: string;
  export default src;
}
declare module '*.otf?url' {
  const src: string;
  export default src;
}
declare module '*.otf?inline' {
  const src: string;
  export default src;
}
declare module '*.ttc' {
  const src: string;
  export default src;
}
declare module '*.ttc?url' {
  const src: string;
  export default src;
}
declare module '*.ttc?inline' {
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
declare module '*.mp4?url' {
  const src: string;
  export default src;
}
declare module '*.mp4?inline' {
  const src: string;
  export default src;
}
declare module '*.webm' {
  const src: string;
  export default src;
}
declare module '*.webm?url' {
  const src: string;
  export default src;
}
declare module '*.webm?inline' {
  const src: string;
  export default src;
}
declare module '*.ogg' {
  const src: string;
  export default src;
}
declare module '*.ogg?url' {
  const src: string;
  export default src;
}
declare module '*.ogg?inline' {
  const src: string;
  export default src;
}
declare module '*.mp3' {
  const src: string;
  export default src;
}
declare module '*.mp3?url' {
  const src: string;
  export default src;
}
declare module '*.mp3?inline' {
  const src: string;
  export default src;
}
declare module '*.wav' {
  const src: string;
  export default src;
}
declare module '*.wav?url' {
  const src: string;
  export default src;
}
declare module '*.wav?inline' {
  const src: string;
  export default src;
}
declare module '*.flac' {
  const src: string;
  export default src;
}
declare module '*.flac?url' {
  const src: string;
  export default src;
}
declare module '*.flac?inline' {
  const src: string;
  export default src;
}
declare module '*.aac' {
  const src: string;
  export default src;
}
declare module '*.aac?url' {
  const src: string;
  export default src;
}
declare module '*.aac?inline' {
  const src: string;
  export default src;
}
declare module '*.mov' {
  const src: string;
  export default src;
}
declare module '*.mov?url' {
  const src: string;
  export default src;
}
declare module '*.mov?inline' {
  const src: string;
  export default src;
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
