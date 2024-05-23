import { pluginBasicSsl } from '@rsbuild/plugin-basic-ssl';

export default {
  plugins: [pluginBasicSsl()],
  server: {
    printUrls: true,
  },
};
