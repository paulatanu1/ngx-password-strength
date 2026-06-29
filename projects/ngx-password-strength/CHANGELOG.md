# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-06-30

### Changed
- README and USER_GUIDE rewritten to lead with the **typed-variable** pattern for `[config]` — declaring `pwdConfig: PasswordValidatorConfig = { ... }` in the component class instead of an inline object literal in the template. This makes IDE autocomplete work for every config field (Angular Language Service has weak autocomplete inside template object literals). No library code or behaviour changes.

## [1.0.1] - 2026-06-30

### Fixed
- README: relative links (`USER_GUIDE.md`, `LICENSE`) replaced with absolute GitHub URLs so they resolve correctly on npmjs.com (the package lives in a subdirectory of the repo).
- `package.json`: added `repository.directory: "projects/ngx-password-strength"` so npm-side tools can locate the package source within the monorepo.

## [1.0.0] - 2026-06-30

Initial public release as `ngx-password-strength-validator`.

### Features

- **Component** — `<ngx-password-strength>` standalone Angular component (selector kept from the project's working name) with strength bar and live, per-rule requirements checklist.
- **Validator** — `passwordValidator(config)` reactive-forms `ValidatorFn` applying the exact same rules as the component. Config is shallow-cloned at creation to prevent mutation surprises. `control.value` is coerced to string before evaluation.
- **Configurable rules** — `PasswordValidatorConfig` for min/max length, uppercase, lowercase, digit, special-character, email and username containment checks. `maxLength` is unlimited unless explicitly set.
- **Unicode-aware** — `requireUppercase` / `requireLowercase` / `requireSpecial` use `\p{Lu}` / `\p{Ll}` with the `u` flag. Non-ASCII letters (`É`, `ñ`, `Ω`, …) correctly satisfy the rules.
- **Outputs** — `(strengthChange)`, `(rulesChange)`, `(validChange)` for non-form-driven integrations.
- **Strict types** — `PasswordRuleKey`, `PasswordRule`, `PasswordStrengthIndex`, `PasswordStrengthLabel`, `PasswordStrengthState`, `PasswordStrengthLabels`. Validator return is narrowed to `{ passwordRules: PasswordRuleKey[] }`.
- **i18n** — `[labels]` input overrides rule and strength labels; `[requirementsAriaLabel]` input customises the requirements list `aria-label`.
- **Theming** — 18 CSS custom properties (`--nps-color-*`, `--nps-bar-*`, `--nps-transition-ms`) for non-invasive theming without `::ng-deep`.
- **Bring your own input** — the component never renders an `<input>`; consumers supply the `[password]` value from any source (signal, `ngModel`, `formControlName`, server preview, …).
- **Packaging** — standalone, OnPush, FESM2022 bundle, `sideEffects: false`, scoped CSS — no Tailwind or external stylesheet required.

### Test coverage

34 Playwright e2e tests (component render, rule toggles, strength-bar progression, validator error shape, outputs, theming/CSS variables, i18n, Unicode regex).

[1.0.2]: https://github.com/paulatanu1/ngx-password-strength/releases/tag/v1.0.2
[1.0.1]: https://github.com/paulatanu1/ngx-password-strength/releases/tag/v1.0.1
[1.0.0]: https://github.com/paulatanu1/ngx-password-strength/releases/tag/v1.0.0
