export default {
  dev: {
    watchFiles: {
      paths: './test-temp-watch.txt',
      type: 'restart',
    },
  },
  server: {
    port: Number(process.env.PORT),
  },
};
