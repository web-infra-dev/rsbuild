# Rsbuild contribution guide

Thank you for your interest in contributing to Rsbuild! Before you start your contribution, please take a moment to read the following guidelines.

---

## Setup the environment

### Fork the repo

[Fork](https://help.github.com/articles/fork-a-repo/) this repository to your
own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local.

## Branches

- `main` -> Rsbuild v1.x
- `v0.x` -> Rsbuild v0.x

### Install Node.js

We recommend using Node.js LTS version. See [Install Node.js](https://nodejs.org/en/download).

### Install dependencies

Enable [pnpm](https://pnpm.io/) with corepack:

```sh
npm i corepack@latest -g
corepack enable
```

Install dependencies:

```sh
pnpm install
```

What this will do:

- Install all dependencies
- Create symlinks between packages in the monorepo
- Run the `prepare` script to build all packages, powered by [nx](https://nx.dev/).

### Set git email

Please make sure you have your email set up in `<https://github.com/settings/emails>`. This will be needed later when you want to submit a pull request.

Check that your git client is already configured the email:

```sh
git config --list | grep email
```

Set the email to global config:

```sh
git config --global user.email "SOME_EMAIL@example.com"
```

Set the email for local repo:

```sh
git config user.email "SOME_EMAIL@example.com"
```

---

## Making changes and building

Once you have set up the local development environment in your forked repo, we can start development.

### Checkout a new branch

It is recommended to develop on a new branch, as it will make things easier later when you submit a pull request:

```sh
git checkout -b MY_BRANCH_NAME
```

### Build the package

Use [nx build](https://nx.dev/nx-api/nx/documents/run) to build the package you want to change:

```sh
npx nx build @rsbuild/core
```

Build all packages:

```sh
pnpm run build
```

---

## Testing

### Add new tests

If you've fixed a bug or added code that should be tested, then add some tests.

You can add unit test cases in the `<PACKAGE_DIR>/tests` folder. The test runner is based on [Rstest](https://rstest.rs/).

### Run unit tests

Before submitting a pull request, it's important to make sure that the changes haven't introduced any regressions or bugs. You can run the unit tests for the project by executing the following command:

```sh
pnpm test
```

You can also run the unit tests of single package:

```sh
pnpm test core
```

### Run E2E tests

Rsbuild uses [playwright](https://github.com/microsoft/playwright) to run end-to-end tests.

You can run the `e2e` command to run E2E tests:

```sh
pnpm run e2e
```

If you need to run a specified test, you can add keywords to filter:

```sh
# Only run test cases which contains `vue` keyword in file path with Rspack
pnpm e2e:rspack vue
# Only run test cases which contains `vue` keyword in test name with Rspack
pnpm e2e:rspack -g vue
```

---

## Linting

To help maintain consistency and readability of the codebase, we use [Biome](https://github.com/biomejs/biome) to lint the codes.

You can run the linters by executing the following command:

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
