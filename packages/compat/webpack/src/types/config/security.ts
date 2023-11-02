import type {
  SriOptions,
  SecurityConfig as BaseSecurityConfig,
  NormalizedSecurityConfig as BaseNormalizedSecurityConfig,
} from '@rsbuild/shared';

export type SecurityConfig = BaseSecurityConfig & {
  /**
   * Adding an integrity attribute (`integrity`) to sub-resources introduced by HTML allows the browser to
   * verify the integrity of the introduced resource, thus preventing tampering with the downloaded resource.
   */
  sri?: SriOptions | boolean;
};

export type NormalizedSecurityConfig = BaseNormalizedSecurityConfig &
  Required<Pick<SecurityConfig, 'sri'>>;
