const PLUGIN_PREACT_NAME = 'rsbuild:preact';
const pluginPreact = (options = {}) => ({
  name: PLUGIN_PREACT_NAME,
  setup(api) {
    const { reactAliasesEnabled = true } = options;
    api.modifyEnvironmentConfig((userConfig, { mergeEnvironmentConfig }) => {
      const reactOptions = {
        development: 'development' === userConfig.mode,
        runtime: 'automatic',
        importSource: 'preact',
      };
      const extraConfig = {
        tools: {
          swc: {
            jsc: {
              parser: {
                syntax: 'typescript',
                // enable supports for JSX/TSX compilation
                tsx: true,
              },
              transform: {
                react: reactOptions,
              },
            },
          },
        },
      };
      if (reactAliasesEnabled) {
        extraConfig.source ||= {};
        extraConfig.source.alias = {
          react: 'preact/compat',
          'react-dom/test-utils': 'preact/test-utils',
          'react-dom': 'preact/compat',
          'react/jsx-runtime': 'preact/jsx-runtime',
        };
      }
      return mergeEnvironmentConfig(extraConfig, userConfig);
    });
  },
});
export { PLUGIN_PREACT_NAME, pluginPreact };
