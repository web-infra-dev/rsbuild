function readPackage(pkg, _context) {
  // do not need eslint
  if (pkg.name === '@modern-js/plugin-lint') {
    delete pkg.dependencies['eslint'];
  }

  if (pkg.dependencies) {
    // alias the rsbuild scoped packages to current workspace
    Object.keys(pkg.dependencies).forEach((key) => {
      if (key.startsWith('@rsbuild/')) {
        pkg.dependencies[key] = 'workspace:*';
      }
    });
  }

  return pkg;
}

module.exports = { hooks: { readPackage } };
