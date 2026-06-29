# ngx-password-strength — User Guide

A reference walkthrough for the `ngx-password-strength` library (v2.x).

## Table of contents

1. [Introduction](#1-introduction)
2. [Prerequisites](#2-prerequisites)
3. [Installation](#3-installation)
4. [Implementation](#4-implementation)
5. [Reactive-forms validator](#5-reactive-forms-validator)
6. [Inputs reference](#6-inputs-reference)
7. [Outputs reference](#7-outputs-reference)
8. [Theming & styling](#8-theming--styling)
9. [Internationalisation](#9-internationalisation)
10. [Strength algorithm](#10-strength-algorithm)
11. [Accessibility](#11-accessibility)
12. [Type reference](#12-type-reference)
13. [Testing your integration](#13-testing-your-integration)
14. [Troubleshooting / FAQ](#14-troubleshooting--faq)
15. [Versioning & support](#15-versioning--support)
16. [License](#16-license)

---

## 1. Introduction

`ngx-password-strength` is a **presentation primitive** for Angular. It renders a four-segment strength bar and a per-rule requirements checklist. It does **not** render an `<input>`, manage form state, or persist anything — the consumer always supplies the `[password]` string and decides what to do with the outputs.

Two exports work together:

- `<ngx-password-strength>` — the standalone component.
- `passwordValidator(config)` — a synchronous `ValidatorFn` that applies the same rules to a `FormControl`.

Both consume a single `PasswordValidatorConfig`. What the user sees is what the form validates against.

**Who it's for.** Angular ≥17 projects that want strict, configurable, easily mirrored-on-the-server password rules with optional visual feedback. The library is deliberately a primitive — no signup flows, no copy-paste templates baked in.

## 2. Prerequisites

| Requirement | Why |
|---|---|
| Angular ≥17 | Standalone components, signal `input()` / `output()` APIs. |
| `@angular/forms` | Only for `passwordValidator`. The component alone doesn't require it. |
| Familiarity with standalone components | Add to `imports`, no `NgModule`. |

No CSS framework is needed.

## 3. Installation

```bash
npm install ngx-password-validator
```

Peer dependencies declared as `>= 17.0.0` for `@angular/common`, `@angular/core`, and `@angular/forms`.

## 4. Implementation

### 4.1 Standalone — no input element

The component is happy with any string. You don't need a form or an input.

```ts
import { Component, signal } from '@angular/core';
import { PasswordStrengthComponent } from 'ngx-password-validator';

@Component({
  standalone: true,
  imports: [PasswordStrengthComponent],
  template: `
    <ngx-password-strength
      [password]="preview()"
      [config]="{ minLength: 10 }"
    />
  `,
})
export class PreviewPane {
  readonly preview = signal('hunter2');
}
```

### 4.2 With your own `<input>` (signal binding)

```html
<input type="password" #pwd (input)="value.set(pwd.value)" />
<ngx-password-strength [password]="value()" [config]="cfg" />
```

```ts
readonly value = signal('');
readonly cfg = { minLength: 12 };
```

### 4.3 With `[(ngModel)]`

```ts
@Component({
  standalone: true,
  imports: [FormsModule, PasswordStrengthComponent],
  template: `
    <input type="password" [(ngModel)]="value" name="pwd" />
    <ngx-password-strength [password]="value" [config]="cfg" />
  `,
})
export class WithNgModel {
  value = '';
  cfg = { minLength: 12 };
}
```

### 4.4 With reactive forms — see §5.

## 5. Reactive-forms validator

`passwordValidator(config)` returns a synchronous `ValidatorFn`. The config is **shallow-cloned at creation** — later mutations to your config object won't change validator behaviour.

```ts
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PasswordStrengthComponent, passwordValidator } from 'ngx-password-validator';

const PWD_RULES = { minLength: 12 } as const;

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PasswordStrengthComponent],
  template: `
    <form [formGroup]="form">
      <input type="password" formControlName="password" />
      <ngx-password-strength
        [password]="form.controls.password.value"
        [config]="PWD_RULES"
      />
    </form>
  `,
})
export class MyForm {
  readonly PWD_RULES = PWD_RULES;
  readonly form = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, passwordValidator(PWD_RULES)],
    }),
  });
}
```

When invalid:

```jsonc
control.errors === {
  "required": true,             // only when value is empty
  "passwordRules": ["length", "upper", "digit", "special"]
}
```

`passwordRules` is strictly typed as `PasswordRuleKey[]`.

> **Parity tip.** Pass the **same** `PWD_RULES` reference to both `passwordValidator()` and `<ngx-password-strength [config]>`. Two separate object literals can drift.

## 6. Inputs reference

| Input | Type | Default | Description |
|---|---|---|---|
| `password` | `string` | `''` | Value to evaluate. Bring your own. |
| `config` | `PasswordValidatorConfig` | `{}` | Rule configuration. |
| `labels` | `PasswordStrengthLabels` | `{}` | i18n overrides (see §9). Unset keys fall back to English defaults. |
| `requirementsAriaLabel` | `string` | `'Password requirements'` | `aria-label` for the requirements list. |

### `PasswordValidatorConfig` fields

| Field | Default | Failure key | Notes |
|---|---|---|---|
| `minLength?: number` | `12` | `length` | Always evaluated. |
| `maxLength?: number` | unlimited | `length` | Omit for no upper bound. When omitted the rule label becomes "At least N characters" instead of "Between N and M characters". |
| `requireUppercase?: boolean` | `true` | `upper` | Unicode-aware (`\p{Lu}`). Letters like `É`, `Ñ`, `Ω` count. |
| `requireLowercase?: boolean` | `true` | `lower` | Unicode-aware (`\p{Ll}`). |
| `requireDigit?: boolean` | `true` | `digit` | ASCII `0–9`. |
| `requireSpecial?: boolean` | `true` | `special` | Any non-letter, non-digit, non-whitespace character. |
| `email?: string` | — | `noEmail` | Case-insensitive containment check — fails if the password contains the full email or its local part. |
| `username?: string` | — | `noUsername` | Case-insensitive containment check. |

### Always-on rules

| Rule | Failure key | Behaviour |
|---|---|---|
| Length range | `length` | Fails if `password.length < minLength` or (when set) `> maxLength`. |
| No whitespace | `noSpace` | Fails if the password contains any whitespace. |

## 7. Outputs reference

| Output | Payload | Fires when |
|---|---|---|
| `strengthChange` | `PasswordStrengthState` = `{ index: 0\|1\|2\|3; label: 'Weak'\|'Fair'\|'Good'\|'Strong' }` | The strength bucket value changes, including on initial render. |
| `rulesChange` | `readonly PasswordRule[]` | Any rule's `met` flag flips, or the rule list itself changes (e.g. config toggled). |
| `validChange` | `boolean` | Toggles to `true` once every active rule is met; `false` otherwise. |

Wiring example:

```ts
@Component({
  template: `
    <ngx-password-strength
      [password]="pwd()"
      [config]="cfg"
      (strengthChange)="strength.set($event)"
      (rulesChange)="rules.set($event)"
      (validChange)="valid.set($event)"
    />
    <pre>{{ strength() | json }}</pre>
    <button [disabled]="!valid()">Submit</button>
  `,
})
class Demo {
  readonly pwd = signal('');
  readonly cfg = { minLength: 12 };
  readonly strength = signal<PasswordStrengthState | null>(null);
  readonly rules = signal<readonly PasswordRule[]>([]);
  readonly valid = signal(false);
}
```

> **Note.** Outputs are convenience signals derived from the same internal state that drives the UI. The reactive-forms validator (`passwordValidator`) is the canonical source for form-level decisions; `validChange` is convenient for non-form contexts.

## 8. Theming & styling

### CSS custom properties

The component exposes a complete theme surface as CSS variables on `:host`. Override them in any stylesheet that targets the host element — no `::ng-deep`, no view-encapsulation tricks.

```css
/* global styles.css */
ngx-password-strength {
  --nps-color-weak:   #dc2626;
  --nps-color-fair:   #ea580c;
  --nps-color-good:   #ca8a04;
  --nps-color-strong: #15803d;
  --nps-color-empty:  #e5e7eb;
  --nps-color-label-muted:    #94a3b8;
  --nps-color-req-text:       #475569;
  --nps-color-req-bg:         #f8fafc;
  --nps-color-req-border:     #e2e8f0;
  --nps-color-icon-bg:        #f1f5f9;
  --nps-color-icon-text:      #94a3b8;
  --nps-color-icon-met-bg:    #dcfce7;
  --nps-color-icon-met-text:  #16a34a;
  --nps-bar-height:    0.5rem;
  --nps-bar-gap:       0.25rem;
  --nps-bar-radius:    0.25rem;
  --nps-transition-ms: 150ms;
}
```

Full variable inventory:

| Variable | Default | Controls |
|---|---|---|
| `--nps-color-weak` | `#ef4444` | Bar fill for "Weak" |
| `--nps-color-fair` | `#f97316` | Bar fill for "Fair" |
| `--nps-color-good` | `#fbbf24` | Bar fill for "Good" |
| `--nps-color-strong` | `#22c55e` | Bar fill for "Strong" |
| `--nps-color-empty` | `#e2e8f0` | Bar fill for unfilled segments |
| `--nps-color-label-muted` | `#cbd5e1` | Strength label colour before `minLength` reached |
| `--nps-color-req-text` | `#475569` | Requirements list text |
| `--nps-color-req-bg` | `rgba(248, 250, 252, 0.8)` | Requirements box background |
| `--nps-color-req-border` | `#f1f5f9` | Requirements box border |
| `--nps-color-icon-bg` | `#f1f5f9` | Unmet rule icon background |
| `--nps-color-icon-text` | `#94a3b8` | Unmet rule icon glyph |
| `--nps-color-icon-met-bg` | `#dcfce7` | Met rule icon background |
| `--nps-color-icon-met-text` | `#16a34a` | Met rule icon glyph |
| `--nps-bar-height` | `0.375rem` | Bar segment height |
| `--nps-bar-gap` | `0.25rem` | Gap between bar segments |
| `--nps-bar-radius` | `9999px` | Bar segment border-radius |
| `--nps-transition-ms` | `300ms` | Colour transition duration |

### Structural CSS overrides

For non-variable structural styles (margin, padding), use a descendant selector from a global stylesheet — Angular's default view encapsulation does not block this:

```css
ngx-password-strength .nps-req-box {
  border: none;
  background: transparent;
  padding: 0;
}
```

## 9. Internationalisation

Pass a `[labels]` input. Every key is optional; unset keys fall back to the English default.

```ts
labels: PasswordStrengthLabels = {
  length: (min, max) =>
    max === undefined ? `Mindestens ${min} Zeichen` : `${min}–${max} Zeichen`,
  noSpace:    'Keine Leerzeichen erlaubt',
  upper:      'Mindestens 1 Großbuchstabe',
  lower:      'Mindestens 1 Kleinbuchstabe',
  digit:      'Mindestens 1 Ziffer',
  special:    'Mindestens 1 Sonderzeichen',
  noEmail:    'Darf nicht deine E-Mail enthalten',
  noUsername: 'Darf nicht deinen Benutzernamen enthalten',
  strength:   { weak: 'Schwach', fair: 'OK', good: 'Gut', strong: 'Stark' },
};
```

```html
<ngx-password-strength
  [password]="pwd()"
  [config]="cfg"
  [labels]="labels"
  [requirementsAriaLabel]="'Passwort-Anforderungen'"
/>
```

## 10. Strength algorithm

The bar uses two gates and one bucketed count.

**Gate 1 — minimum length.** If `password.length < minLength`, all four segments stay empty and the label is hidden. Until you cross `minLength`, no strength is reported.

**Gate 2 — strength rules.** Once `minLength` is reached, the algorithm counts how many of these *strength rules* are satisfied:

`upper`, `lower`, `digit`, `special`, `noEmail` (if `email` configured), `noUsername` (if `username` configured).

Note: `length` and `noSpace` are prerequisites, not strength contributors.

**Bucket.** Let `n` = strength rules met, `t` = total strength rules active.

| Condition | Bucket | Segments lit | Variable |
|---|---|---|---|
| `n === 0` | Weak | 1 | `--nps-color-weak` |
| `n ≤ floor(t × 0.25)` | Weak | 1 | `--nps-color-weak` |
| `n ≤ floor(t × 0.5)` | Fair | 2 | `--nps-color-fair` |
| `n < t` | Good | 3 | `--nps-color-good` |
| `n === t` | Strong | 4 | `--nps-color-strong` |

So with `t = 4` (default rules, no email/username): 1→Weak, 2→Fair, 3→Good, 4→Strong. Adding `email` and `username` raises `t` to 6 and the thresholds shift accordingly.

The bar is a **soft hint**. The validator is the source of truth. A user can see "Strong" but a misconfigured rule could still fail the form; conversely a "Weak" password can never be valid because the form is gated on the same rules.

## 11. Accessibility

- The strength bar row and the requirements list both carry `aria-live="polite"` so screen readers announce updates after the user stops typing.
- The requirements list uses `[attr.aria-label]="requirementsAriaLabel()"` — override for non-English UIs.
- The component adds no focusable elements, so keyboard navigation is unchanged.

What you should still do:

- Provide a `<label for="...">` on your own password `<input>` (the library doesn't render one).
- If you build a form-wide error summary, render the `passwordRules` array using your own messaging (the keys themselves are not user-facing).

## 12. Type reference

```ts
// Re-exported from 'ngx-password-validator'
export type PasswordRuleKey =
  | 'length' | 'noSpace'
  | 'upper'  | 'lower'  | 'digit' | 'special'
  | 'noEmail' | 'noUsername';

export type PasswordStrengthIndex = 0 | 1 | 2 | 3;
export type PasswordStrengthLabel = 'Weak' | 'Fair' | 'Good' | 'Strong';

export interface PasswordRule {
  readonly key: PasswordRuleKey;
  readonly label: string;
  readonly met: boolean;
}

export interface PasswordStrengthState {
  readonly index: PasswordStrengthIndex;
  readonly label: PasswordStrengthLabel;
}

export interface PasswordValidatorConfig {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly requireUppercase?: boolean;
  readonly requireLowercase?: boolean;
  readonly requireDigit?: boolean;
  readonly requireSpecial?: boolean;
  readonly email?: string;
  readonly username?: string;
}

export interface PasswordStrengthLabels {
  readonly length?: (min: number, max: number | undefined) => string;
  readonly noSpace?: string;
  readonly upper?: string;
  readonly lower?: string;
  readonly digit?: string;
  readonly special?: string;
  readonly noEmail?: string;
  readonly noUsername?: string;
  readonly strength?: { readonly weak: string; readonly fair: string; readonly good: string; readonly strong: string };
}

export declare function passwordValidator(config?: PasswordValidatorConfig): ValidatorFn;

export declare class PasswordStrengthComponent {
  readonly password: InputSignal<string>;
  readonly config: InputSignal<PasswordValidatorConfig>;
  readonly labels: InputSignal<PasswordStrengthLabels>;
  readonly requirementsAriaLabel: InputSignal<string>;
  readonly strengthChange: OutputEmitterRef<PasswordStrengthState>;
  readonly rulesChange:    OutputEmitterRef<readonly PasswordRule[]>;
  readonly validChange:    OutputEmitterRef<boolean>;
}
```

## 13. Testing your integration

### Unit-test the validator

```ts
import { FormControl } from '@angular/forms';
import { passwordValidator } from 'ngx-password-validator';

const v = passwordValidator({ minLength: 12 });

expect(new FormControl('short', { validators: [v] }).errors).toEqual({
  passwordRules: expect.arrayContaining(['length']),
});
expect(new FormControl('Aaaaaaaaaaa1!', { validators: [v] }).errors).toBeNull();
```

### Component test with TestBed

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordStrengthComponent } from 'ngx-password-validator';

it('emits validChange(true) when every rule is met', async () => {
  TestBed.configureTestingModule({ imports: [PasswordStrengthComponent] });
  const fixture: ComponentFixture<PasswordStrengthComponent> =
    TestBed.createComponent(PasswordStrengthComponent);
  const valid: boolean[] = [];
  fixture.componentInstance.validChange.subscribe(v => valid.push(v));
  fixture.componentRef.setInput('config', { minLength: 12 });
  fixture.componentRef.setInput('password', 'Aaaaaaaaaaa1!');
  await fixture.whenStable();
  fixture.detectChanges();
  expect(valid.at(-1)).toBe(true);
});
```

### End-to-end with Playwright

```ts
test('weak password keeps submit disabled', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('Password').fill('abc');
  await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
});
```

## 14. Troubleshooting / FAQ

**The strength label is blank.**
By design, until `password.length >= minLength`. Prevents misleading "Strong" labels for short passwords.

**My requirements list is shorter than I expect.**
A `require*: false` was passed in `config`. There is no warning-only mode — a rule is either on (and required) or off (and absent).

**Pixel-diff or screenshot test sees the wrong bar colour.**
The bar uses `transition: background-color var(--nps-transition-ms)` (300 ms default). Either wait for the transition (Playwright's `toHaveCSS` polls automatically), set `--nps-transition-ms: 0ms` in a test stylesheet, or read after a microtask delay.

**TypeScript can't find `PasswordValidatorConfig` (or any other exported type).**
The library's `exports` map already routes types correctly; check that your Angular major version satisfies the `>= 17` peer range — older Angular won't load the FESM bundle.

**Validator says invalid but UI shows all green ticks.**
Different config objects are reaching the validator and the component. Extract one `const cfg = {...}` and pass the same reference to both.

**Can I use this with template-driven forms (`ngModel`)?**
The component works with `[(ngModel)]` — bind `[password]="value"`. The `passwordValidator` is reactive-forms only.

**Is the password stored anywhere?**
No. The component is a pure presentation of the `[password]` input. Nothing is logged, cached, or sent off-component.

**Why are unicode letters like `É` now counted as uppercase?**
v2 switched to Unicode-aware regex (`\p{Lu}`/`\p{Ll}` with the `u` flag). The old ASCII-only behaviour silently failed non-English alphabets.

## 15. Versioning & support

- **SemVer.** Breaking changes to the public exports (component selector, inputs, outputs, `passwordValidator` signature, `PasswordRuleKey` union, `passwordRules` error array shape) bump the major. Visual defaults that don't change semantics are minor.
- **Angular peer range.** `>= 17.0.0`.
- **Bug reports & PRs.** <https://github.com/atanupaul76/ngx-password-strength/issues>
- **Changelog.** [`CHANGELOG.md`](./CHANGELOG.md).

## 16. License

MIT — see [`LICENSE`](./LICENSE).
