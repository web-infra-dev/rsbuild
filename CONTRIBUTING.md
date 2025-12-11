# Rsbuild contribution guide

Thank you for your interest in contributing to Rsbuild! Before you start your contribution, please take a moment to read the following guidelines.

---

## Setup the environment

Fork this repository to your own GitHub account and then clone it locally.

## Branches

- `main` -> Rsbuild v1.x
- `v0.x` -> Rsbuild v0.x

### Install Node.js

Use Node.js LTS or newer. For installation instructions, see [Install Node.js](https://nodejs.org/en/download).

### Install dependencies

Enable [pnpm](https://pnpm.io/) with Corepack and install dependencies:

```sh
npm i corepack@latest -g
corepack enable
pnpm install
```

This installs dependencies, links packages inside the monorepo, and runs the Nx-powered `prepare` script.

---

## Making changes and building

### Checkout a new branch

Create a dedicated branch for your changes:

```sh
git checkout -b MY_BRANCH_NAME
```

### Build the package

Build the package you want to change:

```sh
npx nx build @rsbuild/core
```

Build everything:

```sh
pnpm run build
```

---

## Testing

### Add new tests

Add tests for every bug fix or feature. Unit tests live in `<PACKAGE_DIR>/tests` and use [Rstest](https://rstest.rs/).

### Run unit tests

Run all unit tests:

```sh
pnpm test
```

Run a single package:

```sh
pnpm test core
```

### Run E2E tests

Run end-to-end tests powered by [Playwright](https://github.com/microsoft/playwright):

```sh
pnpm run e2e
```

If you need to run a specified test, you can add keywords to filter:

```sh
# Only run test cases which contains `vue` keyword in file path with Rspack
pnpm e2e:rspack vue
```

---

## Linting

Run [Biome](https://github.com/biomejs/biome) to keep code style consistent:

```sh
pnpm run lint
```

For VS Code users, you can install the [Biome VS Code extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) to see lints while typing.

---

## Documentation

You can find the Rsbuild documentation in the [website](./website) folder.

---

## Submitting changes

### Committing your changes

Commit your changes to your forked repo, and [create a pull request](https://help.github.com/articles/creating-a-pull-request/).

> Normally, the commits in a PR will be squashed into one commit, so you don't need to rebase locally.

### Format of PR titles

The format of PR titles follow [Conventional Commits](https://www.conventionalcommits.org/).

An example:

```
feat(core): Add `myOption` config
^    ^    ^
|    |    |__ Subject
|    |_______ Scope
|____________ Type
```

---

## Releasing

Repository maintainers can publish a new version of changed packages to npm.

1. Checkout a new release branch, for example `release_v1.2.0`
2. Run `pnpm bump` in the package directory to update the version of each package.
3. Create a pull request, the title should be `release: v1.2.0`.
4. Run the [release action](https://github.com/web-infra-dev/rsbuild/actions/workflows/release.yml) to publish packages to npm.
5. Merge the release pull request to `main`.
6. Generate the [release notes](https://github.com/web-infra-dev/rsbuild/releases) via GitHub, see [Automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)
