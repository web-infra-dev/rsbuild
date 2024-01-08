function readPackage(pkg, _context) {
  // do not need eslint
  if (pkg.name === '@modern-js/plugin-lint') {
    delete pkg.dependencies.eslint;
  }

  // Fix: https://github.com/browserify/resolve/issues/264
  // `resolve >= 1.21.0` breaks dts-packer, lock the version to 1.20.0.
  if (pkg.name === 'dts-packer') {
    pkg.dependencies.resolve = '1.20.0';
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
