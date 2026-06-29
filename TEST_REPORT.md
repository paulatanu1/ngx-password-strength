# ngx-password-strength — E2E Test Report (v2.0.0)

**Date:** 2026-06-29
**Library version:** 2.0.0
**Status:** ✅ **All 34 tests passed** (0 failed, 0 flaky, 0 skipped)
**Total duration:** 8.9 s (headless, 4 workers)
**Runner:** Playwright `@playwright/test` ^1.49.0
**Browser:** Chromium (Desktop Chrome viewport)
**Node:** v22.12.0 (pinned in `.nvmrc`)
**Angular:** 21.2.x
**Builder:** `@angular/build:ng-packagr` (library) + `@angular/build:application` (demo)

---

## What changed since the 1.0.0 report

The library was rewritten to address: outputs, strict types, user freedom, loophole fixes, and a "no use cases" docs stance.

| Area | v1.0.0 | v2.0.0 |
|---|---|---|
| Outputs | none | `(strengthChange)`, `(rulesChange)`, `(validChange)` |
| Validator error array type | `string[]` | `PasswordRuleKey[]` |
| Public types exported | `PasswordValidatorConfig` only | + `PasswordRuleKey`, `PasswordRule`, `PasswordStrengthIndex`, `PasswordStrengthLabel`, `PasswordStrengthState`, `PasswordStrengthLabels` |
| Theming | hardcoded inline RGB | 18 CSS custom properties (`--nps-color-*`, `--nps-bar-*`, `--nps-transition-ms`) |
| i18n | none | `[labels]` + `[requirementsAriaLabel]` inputs |
| `maxLength` default | `20` | unlimited (omit for no upper bound) |
| Upper/lower/special regex | ASCII (`[A-Z]`/`[a-z]`) | Unicode-aware (`\p{Lu}`, `\p{Ll}`, `u` flag) |
| Validator config safety | held caller's object by reference | shallow-cloned at creation |
| Value coercion | `.length` would crash on non-strings | `toStringValue(control.value)` |

Total test count rose from 22 to 34 (4 new specs for outputs, 3 for theming, 1 for i18n, 1 for i18n strength label, 1 for `requirementsAriaLabel`, 2 for Unicode regex).

---

## How the build is tested

End-to-end. The demo app (`projects/demo`) imports the published-shape library from `dist/ngx-password-strength/` via the `tsconfig.json` path alias. Playwright boots `ng serve demo` as its `webServer` and drives a real Chromium browser against `http://localhost:4200`.

Every test exercises the **same FESM2022 bundle + type definitions** that npm consumers install — not raw source.

### Layout

```
playwright.config.ts        # boots ng serve demo, html/list/json reporters
tests/e2e/
  component-render.spec.ts  # 4 tests — DOM structure, config-driven rule list
  rules.spec.ts             # 8 tests — each rule flips correctly
  strength-bar.spec.ts      # 5 tests — Weak → Fair → Good → Strong + colours
  validator.spec.ts         # 5 tests — passwordValidator() error shape + form valid/invalid
  outputs.spec.ts           # 5 tests — (strengthChange) (rulesChange) (validChange)  [NEW]
  theming.spec.ts           # 7 tests — CSS vars + i18n + Unicode regex             [NEW]
projects/demo/              # Angular consumer app for the library under test
```

### Run it

```bash
nvm use 22.12.0                # uses .nvmrc
npm install
npm run build                  # ng build ngx-password-strength → dist/
npx playwright install chromium
npm run test:e2e               # headless, 4 workers
npm run test:e2e:headed        # visible browser, 1 worker
npm run test:e2e:report        # open HTML report
```

---

## What was tested (34 cases)

### `outputs.spec.ts` — NEW (5)

| # | Test | Verifies |
|---|------|----------|
| 1 | `(strengthChange)` emits initial state on render | Initial emission of `{index:0, label:'Weak'}` even with empty password |
| 2 | `(strengthChange)` emits as the bucket changes | Bucket transitions Fair → Good → Strong are reflected in the DOM |
| 3 | `(validChange)` flips false→true when every rule is met | One-direction true on first valid state |
| 4 | `(validChange)` flips back to false on regression | Symmetric — typing a weaker password emits `false` again |
| 5 | `(rulesChange)` emits a `PasswordRule[]` reflecting current state | Custom config: digit rule absent, email + username rules present, all met for a passing password |

### `theming.spec.ts` — NEW (7)

| # | Test | Verifies |
|---|------|----------|
| 6 | CSS variables are exposed on `:host` | `--nps-color-weak` / `--nps-color-empty` are readable via `getComputedStyle` |
| 7 | Overriding `--nps-color-strong` flows through | Setting the variable inline on the host changes the bar's computed `background-color` to the override colour |
| 8 | German rule labels render | `[labels]` input replaces "uppercase letter" etc. with German strings |
| 9 | German strength label renders | `labels.strength.strong = 'Stark'` shows in the bar's label span |
| 10 | `requirementsAriaLabel` is applied | `aria-label` attribute matches the provided string |
| 11 | Non-ASCII uppercase letter satisfies `upper` rule | `Éaaaaaaaaaa1!` marks the upper rule met (was a v1 loophole) |
| 12 | Non-ASCII lowercase letter satisfies `lower` rule | `AÑÑÑ…ñÑ1!` marks the lower rule met |

### `component-render.spec.ts` — unchanged (4) — all pass

### `rules.spec.ts` — unchanged (8) — all pass

### `strength-bar.spec.ts` — unchanged (5) — all pass

CSS variables resolve to identical RGB defaults, so existing colour assertions (`rgb(239, 68, 68)` etc.) still match.

### `validator.spec.ts` — unchanged (5) — all pass

The narrowed `PasswordRuleKey[]` return type is structurally identical at runtime, so JSON-string assertions hold.

---

## Findings

### Library bugs found

**None.** All 34 assertions pass on the v2 FESM bundle.

### Loopholes closed in v2 (verified by new tests)

1. **ASCII-only regex** — `[A-Z]` / `[a-z]` rejected international alphabets. Now uses `\p{Lu}` / `\p{Ll}` with the `u` flag. Verified by two Unicode tests (`É` and `ñ`/`Ñ` both satisfy upper/lower).
2. **Mutable validator config** — `passwordValidator(cfg)` held the caller's object by reference; mutating it later silently changed validator behaviour. Now shallow-cloned at creation.
3. **`.length` on non-string control values** — could throw. Now coerced via `toStringValue`.
4. **`maxLength: 20` default** — too restrictive and surprised users with strong passphrases. Now unlimited unless `maxLength` is explicitly set.

### Design principles enforced by tests

- **Bring your own input** — the component renders no `<input>`. Tests use the demo's own inputs to drive `[password]`, confirming the component works as a pure presentation primitive.
- **User freedom** — verified by the theming test (CSS variable override flows to computed style) and the i18n tests (`[labels]` replaces every user-facing string).
- **Strict types** — verified at compile time by `tsconfig` `"strict": true` and the demo's typed imports (`PasswordRule`, `PasswordStrengthState`).

---

## Build verification

```
dist/ngx-password-strength/   build time 1.09 s
  fesm2022/ngx-password-strength.mjs    (FESM bundle)
  fesm2022/ngx-password-strength.mjs.map
  types/ngx-password-strength.d.ts      (type defs incl. new types & outputs)
  package.json                          version 2.0.0
  README.md, CHANGELOG.md, LICENSE, USER_GUIDE.md  (assets)

ngx-password-strength-2.0.0.tgz   19.8 kB packed, 73.2 kB unpacked, 8 files
```

`npm pack` succeeded; tarball contains no demo code, no test artefacts, no Tailwind/PostCSS leakage.

---

## Reports

- **HTML report:** `./playwright-report/index.html` — open with `npm run test:e2e:report`
- **JSON report:** `./playwright-report/results.json`
- **Trace / screenshots:** captured only on failure (none on this run)
