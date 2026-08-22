# SWC plugins

This directory contains the Rust sources for SWC WASM plugins that are owned
and shipped by `@rsbuild/core`.

- `esm-runner-transform` lowers emitted ESM bundles to the protocol consumed
  by the transformed ESM runner.
- The generated WASM binary is not committed. GitHub CI builds it and copies
  it to `packages/core/static` before tests, builds, and releases.

The `@rsbuild/core` build compiles the plugin automatically. To build only
the plugin locally:

```bash
pnpm --filter @rsbuild/core run build:esm-runner-transform
```

Each standalone crate owns its `Cargo.lock` and ignores only its local
`target` directory. If more plugins begin sharing Rust dependencies or build
configuration, this directory can be converted to a Cargo workspace.
