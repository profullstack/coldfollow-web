# Publishing to npm

This guide explains how to publish the `@profullstack/spa-router` package to the npm registry.

## Prerequisites

1. Create an npm account if you don't have one:
   - Go to [https://www.npmjs.com/signup](https://www.npmjs.com/signup)
   - Follow the registration process

2. If you're publishing to the `@profullstack` scope, you need to:
   - Create the organization on npm if it doesn't exist
   - Be a member of the organization with publish rights

## Step 1: Build the Package

Before publishing, build the package to generate the distribution files:

```bash
cd ../spa-router
npm install  # Install dependencies
npm run build  # Run the build script defined in package.json
```

This will create the distribution files in the `dist` directory.

## Step 2: Login to npm

Log in to your npm account from the command line:

```bash
npm login
```

Follow the prompts to enter your username, password, and email.

## Step 3: Publish the Package

### For Scoped Packages (Recommended)

Since your package is scoped (`@profullstack/spa-router`), you need to specify that it's public:

```bash
npm publish --access public
```

### For Unscoped Packages

If you decide to publish without a scope:

```bash
npm publish
```

## Step 4: Verify the Publication

After publishing, verify that your package is available on npm:

1. Visit `https://www.npmjs.com/package/@profullstack/spa-router`
2. Check that the package information and README are displayed correctly

## Updating the Package

When you make changes and want to publish a new version:

1. Update the version in `package.json`:
   - For manual updates, edit the version field directly
   - Or use npm's version command:
     ```bash
     npm version patch  # For bug fixes (0.0.x)
     npm version minor  # For new features (0.x.0)
     npm version major  # For breaking changes (x.0.0)
     ```

2. Build the package again:
   ```bash
   npm run build
   ```

3. Publish the new version:
   ```bash
   npm publish --access public
   ```

## Setting Up Automated Publishing

For a more streamlined workflow, consider setting up GitHub Actions to automatically publish your package when you create a new release:

1. Create a `.github/workflows/publish.yml` file:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

2. Add an NPM_TOKEN secret to your GitHub repository:
   - Generate an npm token: `npm token create`
   - Add the token to your GitHub repository secrets

## Additional Tips

- **README**: Make sure your README.md is comprehensive and well-formatted, as it will be displayed on the npm package page.
- **Keywords**: Add relevant keywords to your package.json to make your package more discoverable.
- **Testing**: Run tests before publishing to ensure everything works correctly.
- **Versioning**: Follow semantic versioning (semver) principles for version numbers.