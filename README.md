# ngx-password-strength-validator — monorepo

This repository is the workspace for the npm package **[`ngx-password-strength-validator`](https://www.npmjs.com/package/ngx-password-strength-validator)**.

The library source, its own README, USER_GUIDE, CHANGELOG, and LICENSE all live inside [`projects/ngx-password-strength/`](./projects/ngx-password-strength/).

## Quick links

- **📦 Package on npm** — <https://www.npmjs.com/package/ngx-password-strength-validator>
- **📖 Library README** — [`projects/ngx-password-strength/README.md`](./projects/ngx-password-strength/README.md)
- **📚 User guide** — [`projects/ngx-password-strength/USER_GUIDE.md`](./projects/ngx-password-strength/USER_GUIDE.md)
- **📝 Changelog** — [`projects/ngx-password-strength/CHANGELOG.md`](./projects/ngx-password-strength/CHANGELOG.md)
- **⚖️ License** — [`projects/ngx-password-strength/LICENSE`](./projects/ngx-password-strength/LICENSE) (MIT)

## Repository layout

```
projects/
  ngx-password-strength/   # the published library
  demo/                    # local Angular app that consumes the built library
                           # — used as the Playwright e2e test harness
tests/e2e/                 # Playwright tests (34 tests, all passing)
playwright.config.ts
angular.json               # workspace config (library + demo)
package.json               # workspace dev dependencies
```

## Working in this repo

```bash
nvm use                 # uses .nvmrc (Node 22.12.0)
npm install
npm run build           # ng build ngx-password-strength → dist/ngx-password-strength
npm run serve:demo      # ng serve demo on http://localhost:4200
npm run test:e2e        # Playwright, headless
npm run test:e2e:headed # Playwright, visible Chromium window
npm run test:e2e:report # open last HTML report
```

## Install (consumers)

```bash
npm install ngx-password-strength-validator
```

```ts
import {
  PasswordStrengthComponent,
  passwordValidator,
  type PasswordValidatorConfig,
} from 'ngx-password-strength-validator';
```

See the [library README](./projects/ngx-password-strength/README.md) and the [user guide](./projects/ngx-password-strength/USER_GUIDE.md) for full API and usage.

## License

[MIT](./projects/ngx-password-strength/LICENSE) © atanupaul76
