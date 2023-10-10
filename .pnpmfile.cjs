function readPackage(pkg, _context) {
  // do not need eslint
  if (pkg.name === '@modern-js/plugin-lint') {
    delete pkg.dependencies['eslint'];
  }

  return pkg;
}

module.exports = { hooks: { readPackage } };
