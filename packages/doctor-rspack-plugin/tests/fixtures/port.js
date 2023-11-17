const { RsbuildDoctorRspackPlugin } = require('../../../dist/index');

const plugin = new RsbuildDoctorRspackPlugin({});

plugin.sdk.bootstrap().then(() => {
  console.log(plugin.sdk.server.port);
});
