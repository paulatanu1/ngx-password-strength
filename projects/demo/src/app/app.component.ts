import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PasswordStrengthComponent,
  passwordValidator,
  type PasswordRule,
  type PasswordStrengthState,
  type PasswordValidatorConfig,
} from '@atanupaul76/ngx-password-strength';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PasswordStrengthComponent, ReactiveFormsModule],
  template: `
    <h1>ngx-password-strength · demo harness</h1>

    <section data-testid="section-default">
      <h2>Default config (min 12, max 20, all rules on)</h2>
      <input
        data-testid="pwd-default"
        type="text"
        [value]="pwdDefault()"
        (input)="pwdDefault.set($any($event.target).value)"
      />
      <ngx-password-strength
        [password]="pwdDefault()"
        [config]="defaultConfig"
        (strengthChange)="onStrengthDefault($event)"
        (validChange)="validDefault.set($event)"
      />
      <div data-testid="default-strength-index">{{ strengthDefault()?.index ?? '' }}</div>
      <div data-testid="default-strength-label">{{ strengthDefault()?.label ?? '' }}</div>
      <div data-testid="default-valid">{{ validDefault() }}</div>
    </section>

    <section data-testid="section-custom">
      <h2>Custom config (min 8, no digit, email + username blocks)</h2>
      <input
        data-testid="pwd-custom"
        type="text"
        [value]="pwdCustom()"
        (input)="pwdCustom.set($any($event.target).value)"
      />
      <ngx-password-strength
        [password]="pwdCustom()"
        [config]="customConfig"
        (rulesChange)="rulesCustom.set($event)"
      />
      <pre data-testid="custom-rules-json">{{ rulesJson() }}</pre>
    </section>

    <section data-testid="section-reactive">
      <h2>Reactive form (passwordValidator)</h2>
      <form [formGroup]="form">
        <input
          data-testid="pwd-reactive"
          type="text"
          formControlName="password"
        />
      </form>
      <ngx-password-strength
        [password]="pwdReactive()"
        [config]="defaultConfig"
      />
      <div data-testid="form-status">{{ formStatus() }}</div>
      <pre data-testid="form-errors">{{ errorsJson() }}</pre>
    </section>

    <section data-testid="section-i18n">
      <h2>i18n via [labels]</h2>
      <input
        data-testid="pwd-i18n"
        type="text"
        [value]="pwdI18n()"
        (input)="pwdI18n.set($any($event.target).value)"
      />
      <ngx-password-strength
        [password]="pwdI18n()"
        [config]="i18nConfig"
        [labels]="germanLabels"
        [requirementsAriaLabel]="'Passwort-Anforderungen'"
      />
    </section>
  `,
})
export class AppComponent {
  readonly defaultConfig: PasswordValidatorConfig = { minLength: 12, maxLength: 20 };

  readonly customConfig: PasswordValidatorConfig = {
    minLength: 8,
    maxLength: 30,
    requireDigit: false,
    email: 'alice@example.com',
    username: 'alice',
  };

  readonly i18nConfig: PasswordValidatorConfig = { minLength: 10 };

  readonly germanLabels = {
    length: (min: number, max: number | undefined) =>
      max === undefined ? `Mindestens ${min} Zeichen` : `${min}–${max} Zeichen`,
    noSpace: 'Keine Leerzeichen erlaubt',
    upper: 'Mindestens 1 Großbuchstabe',
    lower: 'Mindestens 1 Kleinbuchstabe',
    digit: 'Mindestens 1 Ziffer',
    special: 'Mindestens 1 Sonderzeichen',
    strength: { weak: 'Schwach', fair: 'OK', good: 'Gut', strong: 'Stark' },
  } as const;

  readonly pwdDefault = signal('');
  readonly pwdCustom = signal('');
  readonly pwdI18n = signal('');

  readonly strengthDefault = signal<PasswordStrengthState | null>(null);
  readonly validDefault = signal(false);
  readonly rulesCustom = signal<readonly PasswordRule[]>([]);

  readonly form = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, passwordValidator(this.defaultConfig)],
    }),
  });

  readonly pwdReactive = signal('');
  readonly formStatus = signal(this.form.status);
  readonly errorsJson = signal(this.toErrorsJson());

  readonly rulesJson = computed(() =>
    JSON.stringify(this.rulesCustom().map(r => ({ key: r.key, met: r.met }))),
  );

  constructor() {
    const ctrl = this.form.controls.password;
    ctrl.valueChanges.subscribe(value => {
      this.pwdReactive.set(value ?? '');
    });
    ctrl.statusChanges.subscribe(status => {
      this.formStatus.set(status);
      this.errorsJson.set(this.toErrorsJson());
    });
  }

  onStrengthDefault(state: PasswordStrengthState) {
    this.strengthDefault.set(state);
  }

  private toErrorsJson(): string {
    const errs = this.form.controls.password.errors;
    return errs ? JSON.stringify(errs) : 'null';
  }
}
