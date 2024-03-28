const sharedStrategy = () => ({
  name: 'shared-strategy',
  beforeInit(args) {
    const { userOptions, shareInfo } = args;
    const { shared } = userOptions;

    if (shared) {
      Object.keys(shared || {}).forEach((sharedKey) => {
        if (!shared[sharedKey].strategy) {
          shareInfo[sharedKey].strategy = 'loaded-first';
        }
      });
    }
    return args;
  },
});
export default sharedStrategy;
