# ngx-password-strength

[![npm version](https://img.shields.io/npm/v/@atanupaul76/ngx-password-strength.svg)](https://www.npmjs.com/package/@atanupaul76/ngx-password-strength)
[![npm downloads](https://img.shields.io/npm/dm/@atanupaul76/ngx-password-strength.svg)](https://www.npmjs.com/package/@atanupaul76/ngx-password-strength)
[![license](https://img.shields.io/npm/l/@atanupaul76/ngx-password-strength.svg)](./LICENSE)
[![Angular](https://img.shields.io/badge/Angular-%E2%89%A517-dd0031.svg)](https://angular.dev)

A standalone Angular **presentation primitive** for password strength feedback, plus a matching reactive-forms `ValidatorFn`. Strict types, fully configurable, theme-able via CSS variables, zero CSS framework dependencies.

**Bring your own input.** `<ngx-password-strength>` never renders an `<input>`. You give it a `[password]` value from wherever — a signal, `ngModel`, `formControlName`, server preview — and it draws the bar + requirements list.

📖 **Full walkthrough:** [USER_GUIDE.md](./USER_GUIDE.md)

---

## Install

```bash
npm install @atanupaul76/ngx-password-strength
```

Peer deps: `@angular/common`, `@angular/core` (and `@angular/forms` if you use `passwordValidator`), all `>= 17.0.0`.

## Implementation

Standalone component — add it to `imports` and bind `[password]`. That's it.

```ts
import { Component, signal } from '@angular/core';
import { PasswordStrengthComponent } from '@atanupaul76/ngx-password-strength';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PasswordStrengthComponent],
  template: `
    <input type="password" #pwd (input)="value.set(pwd.value)" />

    <ngx-password-strength
      [password]="value()"
      [config]="{ minLength: 12 }"
      (strengthChange)="onStrength($event)"
      (validChange)="canSubmit.set($event)"
    />
  `,
})
export class AppComponent {
  readonly value = signal('');
  readonly canSubmit = signal(false);
  onStrength(s: { index: number; label: string }) { /* ... */ }
}
```

The component is happy without any input box at all — pass any `string` (e.g. a server-side preview):

```html
<ngx-password-strength [password]="someStringFromAnywhere" />
```

## Parameters (Inputs)

| Input | Type | Default | Description |
|---|---|---|---|
| `password` | `string` | `''` | The value to evaluate. Bring your own — signal, `ngModel`, `formControlName`, anything. |
| `config` | `PasswordValidatorConfig` | `{}` | Rule configuration. See table below. |
| `labels` | `PasswordStrengthLabels` | `{}` | i18n overrides for rule labels and strength bucket names. Unset keys fall back to English defaults. |
| `requirementsAriaLabel` | `string` | `'Password requirements'` | `aria-label` for the requirements list. |

### `PasswordValidatorConfig`

| Field | Type | Default | Purpose | Failure key |
|---|---|---|---|---|
| `minLength` | `number` | `12` | Minimum length. | `length` |
| `maxLength` | `number \| undefined` | unlimited | Maximum length. Omit for no upper bound. | `length` |
| `requireUppercase` | `boolean` | `true` | Require an uppercase Unicode letter (`\p{Lu}`). | `upper` |
| `requireLowercase` | `boolean` | `true` | Require a lowercase Unicode letter (`\p{Ll}`). | `lower` |
| `requireDigit` | `boolean` | `true` | Require a digit (0–9). | `digit` |
| `requireSpecial` | `boolean` | `true` | Require a non-letter, non-digit, non-whitespace character. | `special` |
| `email` | `string` | — | If set, password must not contain this email or its local part (case-insensitive). | `noEmail` |
| `username` | `string` | — | If set, password must not contain this username (case-insensitive). | `noUsername` |

Two rules are always active and cannot be disabled: **length** (above) and **`noSpace`** (no whitespace anywhere in the password).

## Events (Outputs)

All three emit on every meaningful change.

| Output | Payload type | Fires when |
|---|---|---|
| `strengthChange` | `{ index: 0 \| 1 \| 2 \| 3; label: 'Weak' \| 'Fair' \| 'Good' \| 'Strong' }` | The strength bucket changes (also on first render). |
| `rulesChange` | `readonly PasswordRule[]` | Any rule's `met` flag flips, or the rule list itself changes (e.g. config toggled). |
| `validChange` | `boolean` | `true` once every active rule is met; `false` otherwise. |

`PasswordRule = { key: PasswordRuleKey; label: string; met: boolean }`
`PasswordRuleKey = 'length' \| 'noSpace' \| 'upper' \| 'lower' \| 'digit' \| 'special' \| 'noEmail' \| 'noUsername'`

## Reactive-forms validator

`passwordValidator(config)` is a synchronous `ValidatorFn` that applies the **exact same rules** as the component. The config is shallow-cloned at creation, so later mutations to your config object don't change validator behaviour.

```ts
import { FormControl } from '@angular/forms';
import { passwordValidator } from '@atanupaul76/ngx-password-strength';

const ctrl = new FormControl('', {
  validators: [passwordValidator({ minLength: 12 })],
});

// ctrl.errors → { passwordRules: PasswordRuleKey[] } | null
```

For UI/validator parity, pass the **same config object reference** to both `passwordValidator()` and `<ngx-password-strength [config]>`.

## Theming (CSS variables)

The component exposes CSS custom properties on `:host`. Override them in any descendant stylesheet (no `::ng-deep` required if you target the host element).

```css
ngx-password-strength {
  --nps-color-weak:   #dc2626;
  --nps-color-fair:   #ea580c;
  --nps-color-good:   #ca8a04;
  --nps-color-strong: #15803d;
  --nps-color-empty:  #e5e7eb;
  --nps-bar-height:   0.5rem;
  --nps-bar-radius:   0.25rem;
  --nps-transition-ms: 150ms;
}
```

Full variable list is in [USER_GUIDE.md](./USER_GUIDE.md#8-theming--styling).

## i18n

```ts
labels: PasswordStrengthLabels = {
  length: (min, max) => max === undefined ? `Mindestens ${min} Zeichen` : `${min}–${max} Zeichen`,
  noSpace: 'Keine Leerzeichen',
  upper: 'Mindestens 1 Großbuchstabe',
  // ... per-rule overrides ...
  strength: { weak: 'Schwach', fair: 'OK', good: 'Gut', strong: 'Stark' },
};
```

```html
<ngx-password-strength [password]="pwd()" [config]="cfg" [labels]="labels" />
```

## License

[MIT](./LICENSE) © atanupaul76
