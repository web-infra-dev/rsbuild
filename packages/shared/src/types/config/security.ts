export type SriOptions = {
  hashFuncNames?: [string, ...string[]];
  enabled?: 'auto' | true | false;
  hashLoading?: 'eager' | 'lazy';
};

export interface SharedSecurityConfig {
  /**
   * Adding an nonce attribute to sub-resources introduced by HTML allows the browser to
   * verify the nonce of the introduced resource, thus preventing xss.
   */
  nonce?: string;
}

export type NormalizedSharedSecurityConfig = Required<SharedSecurityConfig>;
