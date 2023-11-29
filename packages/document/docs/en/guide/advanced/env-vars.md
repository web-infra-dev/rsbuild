# Environment Variables

Rsbuild supports injecting environment variables or expressions into the code during compilation, which is helpful for distinguishing the running environment or injecting constant values. This chapter introduces how to use environment variables.

## Default Variables

### process.env.NODE_ENV

By default, Rsbuild will automatically set the `process.env.NODE_ENV` environment variable to `'development'` in development mode and `'production'` in production mode.

You can use `process.env.NODE_ENV` directly in Node.js and in the runtime code.

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

You can use `process.env.ASSET_PREFIX` in the runtime code to access the URL prefix of static assets.

- In development, it is equivalent to the value set by [dev.assetPrefix](/config/options/dev#dev-assetprefix).
- In production, it is equivalent to the value set by [output.assetPrefix](/config/options/output#output-assetprefix).
- Rsbuild will automatically remove the trailing slash from `assetPrefix` to make string concatenation easier.

For example, we copy the `static/icon.png` image to the `dist` directory through [output.copy](/config/options/output#output-copy) configuration:

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

Then we can access the image URL in the runtime code:

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

## Using define config

By configuring the [source.define](/config/options/source#sourcedefine), you can replace expressions with other expressions or values in compile time.

`Define` looks like macro definitions in other programming languages. But JavaScript has powerful runtime capabilities, so you don't need to use it as a complicated code generator. You can use it to pass simple data, such as environment variables, from compile time to runtime. Almost there, it can be used to work with Rsbuild to shake trees.

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

For more about `source.define`, just refer to [API References](/config/options/source#sourcedefine).

:::tip
The environment variable `NODE_ENV` shown in the example above is already injected by the Rsbuild, and you usually do not need to configure it manually.
:::

### process.env Injection

When using `source.define`, please avoid injecting the entire `process.env` object, e.g. the following usage is not recommended:

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

So please avoid full injection, just inject the used variables from `process.env`.

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
