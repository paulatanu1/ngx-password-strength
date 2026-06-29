# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-06-29

### Added
- **Outputs** on `<ngx-password-strength>`:
  - `(strengthChange)` → `PasswordStrengthState { index, label }`
  - `(rulesChange)` → `readonly PasswordRule[]`
  - `(validChange)` → `boolean` (true when every rule is met)
- **Public types**: `PasswordRuleKey`, `PasswordRule`, `PasswordStrengthIndex`, `PasswordStrengthLabel`, `PasswordStrengthState`, `PasswordStrengthLabels`.
- **`[labels]` input** for i18n — override rule and strength labels without forking the component.
- **`[requirementsAriaLabel]` input** — customize the `aria-label` on the requirements list.
- **CSS custom properties** for theming: `--nps-color-weak`, `--nps-color-fair`, `--nps-color-good`, `--nps-color-strong`, `--nps-color-empty`, plus icon/text/border variables and `--nps-bar-height`, `--nps-bar-gap`, `--nps-bar-radius`, `--nps-transition-ms`.

### Changed (Breaking)
- **`passwordValidator` return type** narrowed: `passwordRules: string[]` → `passwordRules: PasswordRuleKey[]`.
- **`maxLength` no longer defaults to 20.** Omit it for unlimited length. When omitted, the rule label reads "At least N characters" instead of "Between N and M characters".
- **Uppercase / lowercase / special regexes are now Unicode-aware** (`\p{Lu}`, `\p{Ll}`, `\u` flag) — non-ASCII letters like `É`, `ñ`, `Ω` now correctly satisfy the rules.
- **`passwordValidator(config)` shallow-clones its config** at creation time. Mutating the original object after creation no longer changes validator behaviour.
- **Validator coerces `control.value`** to a string, preventing `.length` crashes on numeric or null controls.
- **Bar segment colours moved from inline RGB to CSS variables** with `var(... , fallback)`. Existing visual default unchanged.

### Fixed
- Component no longer assumes ASCII-only alphabets in `requireUppercase` / `requireLowercase` / `requireSpecial`.

## [1.0.0] - 2026-06-29

### Added
- `PasswordStrengthComponent` — standalone Angular component (`<ngx-password-strength>`) with strength bar and live requirements checklist.
- `passwordValidator(config)` — reactive-forms `ValidatorFn` mirroring the component's rules.
- `PasswordValidatorConfig` interface for configuring min/max length, character class requirements, and email/username containment checks.
- Scoped CSS — no Tailwind or external stylesheet required.
- Angular 17+ peer dependency range; OnPush change detection; signal inputs.

[2.0.0]: https://github.com/atanupaul76/ngx-password-strength/releases/tag/v2.0.0
[1.0.0]: https://github.com/atanupaul76/ngx-password-strength/releases/tag/v1.0.0
