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
