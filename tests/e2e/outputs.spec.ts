import { expect, test } from '@playwright/test';

test.describe('Component outputs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('(strengthChange) emits initial state on render', async ({ page }) => {
    // No password typed → strengthIndex 0, label "Weak" (always emits initial)
    await expect(page.getByTestId('default-strength-index')).toHaveText('0');
    await expect(page.getByTestId('default-strength-label')).toHaveText('Weak');
  });

  test('(strengthChange) emits as the bucket changes', async ({ page }) => {
    await page.getByTestId('pwd-default').fill('Aaaaaaaaaaaa');     // Fair (idx 1)
    await expect(page.getByTestId('default-strength-index')).toHaveText('1');
    await expect(page.getByTestId('default-strength-label')).toHaveText('Fair');

    await page.getByTestId('pwd-default').fill('Aaaaaaaaaaa1');     // Good (idx 2)
    await expect(page.getByTestId('default-strength-index')).toHaveText('2');
    await expect(page.getByTestId('default-strength-label')).toHaveText('Good');

    await page.getByTestId('pwd-default').fill('Aaaaaaaaaaa1!');    // Strong (idx 3)
    await expect(page.getByTestId('default-strength-index')).toHaveText('3');
    await expect(page.getByTestId('default-strength-label')).toHaveText('Strong');
  });

  test('(validChange) flips false→true when every rule is met', async ({ page }) => {
    await expect(page.getByTestId('default-valid')).toHaveText('false');
    await page.getByTestId('pwd-default').fill('Aaaaaaaaaaa1!');
    await expect(page.getByTestId('default-valid')).toHaveText('true');
  });

  test('(validChange) flips back to false on regression', async ({ page }) => {
    await page.getByTestId('pwd-default').fill('Aaaaaaaaaaa1!');
    await expect(page.getByTestId('default-valid')).toHaveText('true');
    await page.getByTestId('pwd-default').fill('aaaaaaaaaaaaa');    // drop upper/digit/special
    await expect(page.getByTestId('default-valid')).toHaveText('false');
  });

  test('(rulesChange) emits a PasswordRule[] reflecting current state', async ({ page }) => {
    await page.getByTestId('pwd-custom').fill('SecureP@ssword');     // all default rules met
    const json = await page.getByTestId('custom-rules-json').innerText();
    const parsed = JSON.parse(json) as Array<{ key: string; met: boolean }>;
    // custom config has no digit rule but adds noEmail + noUsername
    const keys = parsed.map(r => r.key);
    expect(keys).toContain('length');
    expect(keys).toContain('noSpace');
    expect(keys).toContain('upper');
    expect(keys).toContain('lower');
    expect(keys).toContain('special');
    expect(keys).not.toContain('digit');
    expect(keys).toContain('noEmail');
    expect(keys).toContain('noUsername');
    // every rule should be met for this password
    expect(parsed.every(r => r.met)).toBe(true);
  });
});
