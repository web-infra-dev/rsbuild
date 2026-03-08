function checkNodeVersion() {
  const { node, bun, deno } = process.versions;
  // Skip non-Node runtimes
  if (!node || bun || deno) return;

  const [majorStr, minorStr] = node.split('.');
  const major = parseInt(majorStr, 10);
  const minor = parseInt(minorStr, 10);
  const supported =
    (major === 20 && minor >= 19) ||
    (major === 22 && minor >= 12) ||
    major > 22;

  if (!supported) {
    throw new Error(
      `Unsupported Node.js version "${node}". Rsbuild requires Node.js 20.19+ or 22.12+. Please upgrade your Node.js version.`,
    );
  }
}

checkNodeVersion();
