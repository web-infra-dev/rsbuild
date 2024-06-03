export type SriOptions = {
  hashFuncName?: string;
  enable?: 'auto' | boolean;
};

export interface SecurityConfig {
  /**
   * Adding an nonce attribute to sub-resources introduced by HTML allows the browser to
   * verify the nonce of the introduced resource, thus preventing xss.
   */
  nonce?: string;

  /**
   * Adding an integrity attribute (`integrity`) to sub-resources introduced by HTML allows the browser to
   * verify the integrity of the introduced resource, thus preventing tampering with the downloaded resource.
   */
  sri?: boolean | SriOptions;
}

export type NormalizedSecurityConfig = Required<SecurityConfig>;
