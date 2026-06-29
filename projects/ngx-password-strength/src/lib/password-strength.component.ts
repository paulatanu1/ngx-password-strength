import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
} from '@angular/core';
import { type AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';

// ---------- Public types ----------

export type PasswordRuleKey =
  | 'length'
  | 'noSpace'
  | 'upper'
  | 'lower'
  | 'digit'
  | 'special'
  | 'noEmail'
  | 'noUsername';

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
  /** Min length (default 12). */
  readonly minLength?: number;
  /** Max length. Omit for no upper bound. */
  readonly maxLength?: number;
  /** Require an uppercase letter (default true). Unicode-aware (\p{Lu}). */
  readonly requireUppercase?: boolean;
  /** Require a lowercase letter (default true). Unicode-aware (\p{Ll}). */
  readonly requireLowercase?: boolean;
  /** Require a digit (default true). */
  readonly requireDigit?: boolean;
  /** Require a special character (any non-letter, non-digit, non-whitespace). Default true. */
  readonly requireSpecial?: boolean;
  /** If set, password must not contain this email or its local part (case-insensitive). */
  readonly email?: string;
  /** If set, password must not contain this username (case-insensitive). */
  readonly username?: string;
}

export interface PasswordStrengthLabels {
  /** Function producing the length-rule label. Receives resolved min and max (max is undefined if unbounded). */
  readonly length?: (min: number, max: number | undefined) => string;
  readonly noSpace?: string;
  readonly upper?: string;
  readonly lower?: string;
  readonly digit?: string;
  readonly special?: string;
  readonly noEmail?: string;
  readonly noUsername?: string;
  readonly strength?: {
    readonly weak: string;
    readonly fair: string;
    readonly good: string;
    readonly strong: string;
  };
}

// ---------- Internals ----------

const DEFAULT_MIN_LENGTH = 12;

const RE_UPPER = /\p{Lu}/u;
const RE_LOWER = /\p{Ll}/u;
const RE_DIGIT = /\d/;
const RE_SPECIAL = /[^\p{L}\p{N}\s]/u;
const RE_WHITESPACE = /\s/;

const DEFAULT_LABELS: Required<Omit<PasswordStrengthLabels, 'length'>> & {
  length: NonNullable<PasswordStrengthLabels['length']>;
} = {
  length: (min, max) =>
    max === undefined ? `At least ${min} characters` : `Between ${min} and ${max} characters`,
  noSpace: 'No spaces allowed',
  upper: 'At least 1 uppercase letter',
  lower: 'At least 1 lowercase letter',
  digit: 'At least 1 digit (0–9)',
  special: 'At least 1 special character',
  noEmail: 'Must not contain your email address',
  noUsername: 'Must not contain your username',
  strength: { weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong' },
};

const STRENGTH_VAR: readonly string[] = [
  'var(--nps-color-weak, #ef4444)',
  'var(--nps-color-fair, #f97316)',
  'var(--nps-color-good, #fbbf24)',
  'var(--nps-color-strong, #22c55e)',
];

const EMPTY_VAR = 'var(--nps-color-empty, #e2e8f0)';

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function evaluateRules(pwd: string, cfg: PasswordValidatorConfig): PasswordRuleKey[] {
  const min = cfg.minLength ?? DEFAULT_MIN_LENGTH;
  const max = cfg.maxLength;
  const failed: PasswordRuleKey[] = [];

  if (pwd.length < min || (max !== undefined && pwd.length > max)) failed.push('length');
  if (pwd.length > 0 && RE_WHITESPACE.test(pwd)) failed.push('noSpace');
  if (cfg.requireUppercase !== false && !RE_UPPER.test(pwd)) failed.push('upper');
  if (cfg.requireLowercase !== false && !RE_LOWER.test(pwd)) failed.push('lower');
  if (cfg.requireDigit !== false && !RE_DIGIT.test(pwd)) failed.push('digit');
  if (cfg.requireSpecial !== false && !RE_SPECIAL.test(pwd)) failed.push('special');
  if (cfg.email) {
    const pl = pwd.toLowerCase();
    const emailLower = cfg.email.toLowerCase();
    const local = emailLower.split('@')[0] ?? '';
    if (pl.includes(emailLower) || (local.length > 0 && pl.includes(local))) failed.push('noEmail');
  }
  if (cfg.username && pwd.toLowerCase().includes(cfg.username.toLowerCase())) {
    failed.push('noUsername');
  }
  return failed;
}

// ---------- Public validator ----------

/**
 * Returns a synchronous reactive-forms `ValidatorFn` that mirrors the rules of
 * `<ngx-password-strength>`. Pair the same `config` reference with both for
 * UI/validator parity.
 *
 * On failure the control's `errors` map is:
 *   `{ passwordRules: PasswordRuleKey[] }`
 */
export function passwordValidator(config: PasswordValidatorConfig = {}): ValidatorFn {
  // Shallow-clone so later mutation of the caller's object can't change validator behaviour.
  const cfg: PasswordValidatorConfig = { ...config };
  return (control: AbstractControl): ValidationErrors | null => {
    const pwd = toStringValue(control.value);
    const failed = evaluateRules(pwd, cfg);
    return failed.length ? { passwordRules: failed } : null;
  };
}

// ---------- Component ----------

@Component({
  selector: 'ngx-password-strength',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      --nps-color-weak:   #ef4444;
      --nps-color-fair:   #f97316;
      --nps-color-good:   #fbbf24;
      --nps-color-strong: #22c55e;
      --nps-color-empty:  #e2e8f0;
      --nps-color-label-muted: #cbd5e1;
      --nps-color-req-text:    #475569;
      --nps-color-req-bg:      rgba(248, 250, 252, 0.8);
      --nps-color-req-border:  #f1f5f9;
      --nps-color-icon-bg:     #f1f5f9;
      --nps-color-icon-text:   #94a3b8;
      --nps-color-icon-met-bg:   #dcfce7;
      --nps-color-icon-met-text: #16a34a;
      --nps-bar-height: 0.375rem;
      --nps-bar-gap: 0.25rem;
      --nps-bar-radius: 9999px;
      --nps-transition-ms: 300ms;
    }
    .nps-bar-row { margin-top: 0.5rem; display: flex; width: 100%; align-items: center; gap: 0.75rem; }
    .nps-bar-track { display: flex; flex: 1 1 0%; gap: var(--nps-bar-gap); }
    .nps-bar-seg {
      height: var(--nps-bar-height);
      flex: 1 1 0%;
      border-radius: var(--nps-bar-radius);
      background-color: var(--nps-color-empty);
      transition: background-color var(--nps-transition-ms);
    }
    .nps-label {
      width: 5rem; flex-shrink: 0; text-align: right;
      font-size: 0.75rem; font-weight: 600;
      color: var(--nps-color-label-muted);
    }
    .nps-req-box {
      margin-top: 0.5rem;
      border: 1px solid var(--nps-color-req-border);
      background-color: var(--nps-color-req-bg);
      border-radius: 0.75rem; padding: 0.75rem;
    }
    .nps-req-list { display: flex; flex-direction: column; gap: 0.25rem; margin: 0; padding: 0; list-style: none; }
    .nps-req-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--nps-color-req-text); }
    .nps-req-icon {
      display: inline-flex; height: 1rem; width: 1rem; flex-shrink: 0;
      align-items: center; justify-content: center; border-radius: 9999px;
      font-size: 0.625rem; font-weight: 700;
      background-color: var(--nps-color-icon-bg);
      color: var(--nps-color-icon-text);
    }
    .nps-req-icon.met {
      background-color: var(--nps-color-icon-met-bg);
      color: var(--nps-color-icon-met-text);
    }
  `],
  template: `
    <div class="nps-bar-row" aria-live="polite">
      <div class="nps-bar-track">
        @for (seg of segments; track seg) {
          <div
            class="nps-bar-seg"
            [style.background-color]="reachedMinLength() && seg <= strengthIndex() ? barColor() : emptyColor"
          ></div>
        }
      </div>
      <span class="nps-label" [style.color]="reachedMinLength() ? barColor() : ''">
        {{ reachedMinLength() ? strengthLabel() : '' }}
      </span>
    </div>

    <div class="nps-req-box" [attr.aria-label]="requirementsAriaLabel()">
      <ul class="nps-req-list" aria-live="polite">
        @for (rule of rules(); track rule.key) {
          <li class="nps-req-item">
            <span class="nps-req-icon" [class.met]="rule.met">{{ rule.met ? '✓' : '○' }}</span>
            {{ rule.label }}
          </li>
        }
      </ul>
    </div>
  `,
})
export class PasswordStrengthComponent {
  /** Current password value to evaluate. */
  readonly password = input<string>('');
  /** Rule configuration. Pass the same reference to `passwordValidator` for parity. */
  readonly config = input<PasswordValidatorConfig>({});
  /** Override rule and strength labels (for i18n). Unset keys fall back to English defaults. */
  readonly labels = input<PasswordStrengthLabels>({});
  /** aria-label for the requirements list. */
  readonly requirementsAriaLabel = input<string>('Password requirements');

  /** Emits `{index, label}` whenever the strength bucket changes. */
  readonly strengthChange = output<PasswordStrengthState>();
  /** Emits the full rules array whenever any rule's `met` flag changes. */
  readonly rulesChange = output<readonly PasswordRule[]>();
  /** Emits `true` once every rule is met; `false` otherwise. */
  readonly validChange = output<boolean>();

  protected readonly segments = [0, 1, 2, 3] as const;
  protected readonly emptyColor = EMPTY_VAR;

  private readonly mergedLabels = computed(() => ({ ...DEFAULT_LABELS, ...this.labels(), strength: { ...DEFAULT_LABELS.strength, ...(this.labels().strength ?? {}) } }));

  protected readonly rules = computed<readonly PasswordRule[]>(() => {
    const pwd = toStringValue(this.password());
    const cfg = this.config();
    const lbls = this.mergedLabels();
    const min = cfg.minLength ?? DEFAULT_MIN_LENGTH;
    const max = cfg.maxLength;
    const emailLocal = (cfg.email ?? '').toLowerCase().split('@')[0] ?? '';
    const userLower = (cfg.username ?? '').toLowerCase();
    const pwdLower = pwd.toLowerCase();

    const list: PasswordRule[] = [
      {
        key: 'length',
        label: lbls.length(min, max),
        met: pwd.length >= min && (max === undefined || pwd.length <= max),
      },
      {
        key: 'noSpace',
        label: lbls.noSpace,
        met: pwd.length > 0 && !RE_WHITESPACE.test(pwd),
      },
    ];
    if (cfg.requireUppercase !== false) list.push({ key: 'upper', label: lbls.upper, met: RE_UPPER.test(pwd) });
    if (cfg.requireLowercase !== false) list.push({ key: 'lower', label: lbls.lower, met: RE_LOWER.test(pwd) });
    if (cfg.requireSpecial   !== false) list.push({ key: 'special', label: lbls.special, met: RE_SPECIAL.test(pwd) });
    if (cfg.requireDigit     !== false) list.push({ key: 'digit', label: lbls.digit, met: RE_DIGIT.test(pwd) });
    if (cfg.email) {
      list.push({
        key: 'noEmail',
        label: lbls.noEmail,
        met:
          pwd.length > 0 && emailLocal.length > 0
            ? !pwdLower.includes(emailLocal) && !pwdLower.includes((cfg.email ?? '').toLowerCase())
            : pwd.length > 0,
      });
    }
    if (cfg.username) {
      list.push({
        key: 'noUsername',
        label: lbls.noUsername,
        met:
          pwd.length > 0 && userLower.length > 0 ? !pwdLower.includes(userLower) : pwd.length > 0,
      });
    }
    return list;
  });

  protected readonly reachedMinLength = computed(() => {
    const min = this.config().minLength ?? DEFAULT_MIN_LENGTH;
    return toStringValue(this.password()).length >= min;
  });

  protected readonly strengthIndex = computed<PasswordStrengthIndex>(() => {
    const strengthKeys: ReadonlySet<PasswordRuleKey> = new Set([
      'upper',
      'lower',
      'digit',
      'special',
      'noEmail',
      'noUsername',
    ]);
    const strengthRules = this.rules().filter(r => strengthKeys.has(r.key));
    const metCount = strengthRules.filter(r => r.met).length;
    const total = strengthRules.length;
    if (total === 0 || metCount === 0) return 0;
    if (metCount <= Math.floor(total * 0.25)) return 0;
    if (metCount <= Math.floor(total * 0.5))  return 1;
    if (metCount < total)                      return 2;
    return 3;
  });

  protected readonly strengthLabel = computed<PasswordStrengthLabel>(() => {
    const s = this.mergedLabels().strength;
    return ([s.weak, s.fair, s.good, s.strong] as const)[this.strengthIndex()] as PasswordStrengthLabel;
  });

  protected readonly barColor = computed(() => STRENGTH_VAR[this.strengthIndex()]);

  protected readonly allValid = computed(() => this.rules().every(r => r.met));

  constructor() {
    effect(() => {
      this.strengthChange.emit({ index: this.strengthIndex(), label: this.strengthLabel() });
    });
    effect(() => {
      this.rulesChange.emit(this.rules());
    });
    effect(() => {
      this.validChange.emit(this.allValid());
    });
  }
}
