import { expect, test } from '@playwright/test';

test.describe('CSS variables theming', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('CSS variables are exposed on :host', async ({ page }) => {
    const host = page.locator('ngx-password-strength').first();
    const weak = await host.evaluate(el => getComputedStyle(el).getPropertyValue('--nps-color-weak').trim());
    const empty = await host.evaluate(el => getComputedStyle(el).getPropertyValue('--nps-color-empty').trim());
    expect(weak).toBe('#ef4444');
    expect(empty).toBe('#e2e8f0');
  });

  test('overriding --nps-color-strong via inline style flows through to bar segments', async ({
    page,
  }) => {
    // Override the variable on the host then fill a Strong password
    const host = page.getByTestId('section-default').locator('ngx-password-strength');
    await host.evaluate(el => (el as HTMLElement).style.setProperty('--nps-color-strong', '#111111'));
    await page.getByTestId('pwd-default').fill('Aaaaaaaaaaa1!');
    const seg = host.locator('.nps-bar-seg').first();
    await expect(seg).toHaveCSS('background-color', 'rgb(17, 17, 17)');
  });
});

test.describe('i18n via [labels] input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('German labels render in the requirements list', async ({ page }) => {
    const section = page.getByTestId('section-i18n');
    const items = section.locator('.nps-req-item');
    const text = (await items.allInnerTexts()).join('\n');
    expect(text).toContain('Keine Leerzeichen');
    expect(text).toContain('Großbuchstabe');
    expect(text).toContain('Kleinbuchstabe');
    expect(text).toContain('Ziffer');
    expect(text).toContain('Sonderzeichen');
  });

  test('German strength label renders', async ({ page }) => {
    await page.getByTestId('pwd-i18n').fill('Aaaaaaaaaa1!'); // 12 chars, all rules met
    await expect(page.getByTestId('section-i18n').locator('.nps-label')).toHaveText('Stark');
  });

  test('requirementsAriaLabel is applied', async ({ page }) => {
    const box = page.getByTestId('section-i18n').locator('.nps-req-box');
    await expect(box).toHaveAttribute('aria-label', 'Passwort-Anforderungen');
  });
});

test.describe('Unicode-aware regex', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('non-ASCII uppercase letter satisfies the upper rule', async ({ page }) => {
    await page.getByTestId('pwd-default').fill('Éaaaaaaaaaaa1!');
    const upperItem = page.getByTestId('section-default').locator('.nps-req-item', { hasText: 'uppercase' });
    await expect(upperItem.locator('.nps-req-icon')).toHaveClass(/\bmet\b/);
  });

  test('non-ASCII lowercase letter satisfies the lower rule', async ({ page }) => {
    await page.getByTestId('pwd-default').fill('AÑÑÑÑÑÑÑÑñÑ1!');
    const lowerItem = page.getByTestId('section-default').locator('.nps-req-item', { hasText: 'lowercase' });
    await expect(lowerItem.locator('.nps-req-icon')).toHaveClass(/\bmet\b/);
  });
});
