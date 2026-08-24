<p align="center">
  <a href="https://rsbuild.rs" target="blank"><img src="https://assets.rspack.rs/rsbuild/rsbuild-banner.png" alt="Rsbuild Logo" /></a>
</p>

# create-rsbuild

Create a new Rsbuild project.

<p>
  <a href="https://npmjs.com/package/create-rsbuild">
   <img src="https://img.shields.io/npm/v/create-rsbuild?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/create-rsbuild"><img src="https://img.shields.io/npm/dm/create-rsbuild.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p>

## Usage

Using `npm create`:

```bash
npm create rsbuild@latest
```

Using CLI flags:

```bash
npx create-rsbuild --dir my-project --template react

# Using abbreviations
npx create-rsbuild -d my-project -t react

# Skip Git initialization
npx create-rsbuild --dir my-project --template react --no-git
```

### Template examples

The following commands create a project without interactive prompts:

- **Vanilla**

  ```bash
  npx -y create-rsbuild@latest my-app -t vanilla-js
  npx -y create-rsbuild@latest my-app -t vanilla-ts
  ```

- **React**

  ```bash
  npx -y create-rsbuild@latest my-app -t react-js
  npx -y create-rsbuild@latest my-app -t react-ts
  ```

- **Vue**

  ```bash
  npx -y create-rsbuild@latest my-app -t vue-js
  npx -y create-rsbuild@latest my-app -t vue-ts
  ```

- **Lit**

  ```bash
  npx -y create-rsbuild@latest my-app -t lit-js
  npx -y create-rsbuild@latest my-app -t lit-ts
  ```

- **Preact**

  ```bash
  npx -y create-rsbuild@latest my-app -t preact-js
  npx -y create-rsbuild@latest my-app -t preact-ts
  ```

- **Svelte**

  ```bash
  npx -y create-rsbuild@latest my-app -t svelte-js
  npx -y create-rsbuild@latest my-app -t svelte-ts
  ```

- **Solid**

  ```bash
  npx -y create-rsbuild@latest my-app -t solid-js
  npx -y create-rsbuild@latest my-app -t solid-ts
  ```

- **Solid 2 (RC)**

  ```bash
  npx -y create-rsbuild@latest my-app -t solid2-js
  npx -y create-rsbuild@latest my-app -t solid2-ts
  ```

- **Octane**

  ```bash
  npx -y create-rsbuild@latest my-app -t octane-js
  npx -y create-rsbuild@latest my-app -t octane-ts
  ```

## Documentation

See [Documentation](https://rsbuild.rs/guide/start/quick-start).

## License

[MIT](https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE).
