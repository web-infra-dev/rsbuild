module.exports = async function getFilename() {
  const path = await import('node:path');

  return path.basename('/tmp/index.js');
};
