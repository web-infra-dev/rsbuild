# Environment Variables

Rsbuild supports injecting environment variables or expressions into the code during compilation, which is helpful for distinguishing the running environment or replacing constants. This chapter introduces how to use environment variables.

## Default Variables

### process.env.NODE_ENV

By default, Rsbuild will automatically set the `process.env.NODE_ENV` environment variable to `'development'` in development mode and `'production'` in production mode.

You can use `process.env.NODE_ENV` directly in Node.js and in the client code.

```ts
if (process.env.NODE_ENV === 'development') {
  console.log('this is a development log');
}
```

In the development environment, the above code will be compiled as:

```js
if (true) {
  console.log('this is a development log');
}
```

In the production environment, the above code will be compiled as:

```js
if (false) {
  console.log('this is a development log');
}
```

After code minification, `if (false) { ... }` will be recognized as invalid code and removed automatically.

### process.env.ASSET_PREFIX

You can use `process.env.ASSET_PREFIX` in the client code to access the URL prefix of static assets.

- In development, it is equivalent to the value set by [dev.assetPrefix](/config/dev/asset-prefix).
- In production, it is equivalent to the value set by [output.assetPrefix](/config/output/asset-prefix).
- Rsbuild will automatically remove the trailing slash from `assetPrefix` to make string concatenation easier.

For example, we copy the `static/icon.png` image to the `dist` directory through [output.copy](/config/output/copy) configuration:

```ts
export default {
  dev: {
    assetPrefix: '/',
  },
  output: {
    copy: [{ from: './static', to: 'static' }],
    assetPrefix: 'https://example.com',
  },
};
```

Then we can access the image URL in the client code:

```jsx
const Image = <img src={`${process.env.ASSET_PREFIX}/static/icon.png`} />;
```

In the development environment, the above code will be compiled as:

```jsx
const Image = <img src={`/static/icon.png`} />;
```

In the production environment, the above code will be compiled as:

```jsx
const Image = <img src={`https://example.com/static/icon.png`} />;
```

## `.env` File

When a `.env` file exists in the project root directory, Rsbuild will automatically use [dotenv](https://npmjs.com/package/dotenv) to load these environment variables and add them to the current Node.js process.

### File Types

Rsbuild supports reading the following types of env files:

| File Name                | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| `.env`                   | Loaded by default in all scenarios.                                        |
| `.env.local`             | Local usage of the `.env` file, should be added to .gitignore.             |
| `.env.development`       | Read when `process.env.NODE_ENV` is `'development'`.                       |
| `.env.production`        | Read when `process.env.NODE_ENV` is `'production'`.                        |
| `.env.development.local` | Local usage of the `.env.development` file, should be added to .gitignore. |
| `.env.production.local`  | Local usage of the `.env.production` file, should be added to .gitignore.  |

If several of the above files exist at the same time, they will all be loaded, with the files listed at the bottom of the table having higher priority.

### Env Mode

Rsbuild also supports reading `.env.[mode]` and `.env.[mode].local` files. You can specify the env mode using the `--env-mode <mode>` CLI option.

For example, set the env mode as `test`:

```bash
npx rsbuild dev --env-mode test
```

Rsbuild will then read the following files in sequence:

- .env
- .env.local
- .env.test
- .env.test.local

:::tip
The `--env-mode` option takes precedence over `process.env.NODE_ENV`.

It is recommended to use `--env-mode` to set the env mode, and not to modify `process.env.NODE_ENV`.

:::

### Example

For example, create a `.env` file and add the following contents:

```shell title=".env"
FOO=hello
BAR=1
```

Then in the `rsbuild.config.ts` file, you can directly access the above environment variables:

```ts title="rsbuild.config.ts"
console.log(process.env.FOO); // 'hello'
console.log(process.env.BAR); // '1'
```

Now, create a `.env.local` file and add the following contents:

```shell title=".env.local"
BAR=2
```

The value of `process.env.BAR` is overwritten to `'2'`:

```ts title="rsbuild.config.ts"
console.log(process.env.FOO); // 'hello'
console.log(process.env.BAR); // '2'
```

## Public Variables

All environment variables starting with `PUBLIC_` can be accessed in client code. For example, if the following variables are defined:

```bash title=".env"
PUBLIC_NAME=jack
PASSWORD=123
```

In the source file of the client code, you can access public variables in the following way. Rsbuild will replace identifiers starting with `process.env.PUBLIC_` with the corresponding expression.

```ts title="src/index.ts"
console.log(process.env.PUBLIC_NAME); // -> 'jack'
console.log(process.env.PASSWORD); // -> undefined
```

:::tip

- The content of public variables will be exposed to your client code, so please avoid including sensitive information in public variables.
- Public variables are replaced through [source.define](/config/source/define). Please read ["Using define config"](#using-define-config) to understand the principles and notes of define.

:::

### Replacement Scope

Public variables will replace identifiers in the client code, with the replacement scope including:

- JavaScript files, and files that can be converted into JavaScript code, such as `.js`, `.ts`, `.tsx`, etc.
- HTML template files, for example:

```ejs title="template.html"
<div><%= process.env.PUBLIC_NAME %></div>
```

Note that public variables will not replace identifiers in the following files:

- CSS files, such as `.css`, `.scss`, `.less`, etc.

### Custom Prefix

Rsbuild provides the [loadEnv](/api/javascript-api/core#loadenv) method, which can inject environment variables with any prefix into client code.

For example, when migrating a Create React App project to Rsbuild, you can read environment variables starting with `REACT_APP_` and inject them through the [source.define](/config/source/define) config as follows:

```ts title="rsbuild.config.ts"
import { defineConfig, loadEnv } from '@rsbuild/core';

const { publicVars } = loadEnv({ prefixes: ['REACT_APP_'] });

export default defineConfig({
  source: {
    define: publicVars,
  },
});
```

## Using define config

By configuring the [source.define](/config/source/define), you can replace expressions with other expressions or values in compile time.

`Define` looks like macro definitions in other programming languages. But JavaScript has powerful runtime capabilities, so you don't need to use it as a complicated code generator. You can use it to pass simple data, such as environment variables, from compile time to client code. Almost there, it can be used to work with Rsbuild to shake trees.

### Replace Expressions

The most basic use case for `Define` is to replace expressions in compile time.

The value of the environment variable `NODE_ENV` will change the behavior of many vendor packages. Usually, we need to set it to `production`.

```js
export default {
  source: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  },
};
```

Note that the value provided here must be a JSON string, e.g. `process.env.NODE_ENV` with a value of `"production"` should be passed in as `"\"production\""` to be processed correctly.

Similarly `{ foo: "bar" }` should be converted to `"{\"foo\":\"bar\"}"`, which if passed directly into the original object would mean replacing the expression `process.env.NODE_ENV.foo` with the identifier `bar`.

For more about `source.define`, just refer to [API References](/config/source/define).

:::tip
The environment variable `NODE_ENV` shown in the example above is already injected by the Rsbuild, and you usually do not need to configure it manually.
:::

### process.env Replacement

When using `source.define`, please avoid replacing the entire `process.env` object, e.g. the following usage is not recommended:

```js
export default {
  source: {
    define: {
      'process.env': JSON.stringify(process.env),
    },
  },
};
```

If the above usage is adopted, the following problems will be caused:

1. Some unused environment variables are additionally injected, causing the environment variables of the development environment to be leaked into the front-end code.
2. As each `process.env` code will be replaced by a complete environment variable object, the bundle size of the front-end code will increase and the performance will decrease.

Therefore, please inject the environment variables on `process.env` according to actual needs and avoid replacing them in its entirety.

## Notes

Note that `source.define` will only match the full expression; destructing the expression will prevent the Rsbuild from correctly recognizing it.

```js
console.log(process.env.NODE_ENV);
// => production

const { NODE_ENV } = process.env;
console.log(NODE_ENV);
// => undefined

const vars = process.env;
console.log(vars.NODE_ENV);
// => undefined
```

## Declare type of environment variable

When you read an environment variable in a TypeScript file, TypeScript may prompt that the variable lacks a type definition, and you need to add the corresponding type declaration.

For example, if you reference a `CUSTOM_VAR` variable, the following prompt will appear in the TypeScript file:

```
TS2304: Cannot find name 'CUSTOM_VAR'.
```

To fix this, you can create a `src/env.d.ts` file in your project and add the following content:

```ts title="src/env.d.ts"
declare const CUSTOM_VAR: string;
```

## Tree Shaking

`Define` can also be used to mark dead code to assist the Rsbuild with Tree Shaking optimization.

Build artifacts for different regions is achieved by replacing `process.env.REGION` with a specific value, for example.

```js
export default {
  source: {
    define: {
      'process.env.REGION': JSON.stringify(process.env.REGION),
    },
  },
};
```

For an internationalized app:

```js
const App = () => {
  if (process.env.REGION === 'cn') {
    return <EntryFoo />;
  } else if (process.env.REGION === 'sg') {
    return <EntryBar />;
  } else {
    return <EntryBaz />;
  }
};
```

Specifying the environment variable `REGION=sg` and then executing build will eliminate any dead code.

```js
const App = () => {
  if (false) {
  } else if (true) {
    return <EntryBar />;
  } else {
  }
};
```

Unused components are not bundled into the artifacts, and their external dependencies can be optimized accordingly, resulting in a destination with better size and performance.
