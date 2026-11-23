export default () => ({
  name: 'replace-message',
  visitor: {
    StringLiteral(path) {
      if (path.node.value === 'compiled without babel') {
        path.node.value = 'compiled by cached babel-loader';
      }
    },
  },
});
