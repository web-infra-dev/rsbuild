const { DoctorWebpackPlugin } = require('../../dist/index');

const plugin = new DoctorWebpackPlugin({});

plugin.sdk.bootstrap().then(() => {
  console.log(plugin.sdk.server.port);
});
