# SWC plugins

This directory contains the Rust sources for SWC WASM plugins that are owned
and shipped by `@rsbuild/core`.

- `esm-runner-transform` lowers emitted ESM bundles to the protocol consumed
  by the transformed ESM runner.
- The generated WASM binary is not committed. GitHub CI builds it and copies
  it to `packages/core/static` before tests, builds, and releases.

To build the plugin locally:

```bash
rustup target add wasm32-wasip1
cargo build \
  --manifest-path packages/core/swc-plugins/esm-runner-transform/Cargo.toml \
  --locked \
  --release \
  --target wasm32-wasip1
cp \
  packages/core/swc-plugins/esm-runner-transform/target/wasm32-wasip1/release/rsbuild_swc_esm_runner_transform.wasm \
  packages/core/static/swc-esm-runner-transform.wasm
```

Each standalone crate owns its `Cargo.lock` and ignores only its local
`target` directory. If more plugins begin sharing Rust dependencies or build
configuration, this directory can be converted to a Cargo workspace.
