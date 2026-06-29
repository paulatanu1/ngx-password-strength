import { expect, test } from '@playwright/test';

test.describe('passwordValidator (reactive form)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('empty value → required error, form INVALID', async ({ page }) => {
    await expect(page.getByTestId('form-status')).toHaveText('INVALID');
    await expect(page.getByTestId('form-errors')).toContainText('"required":true');
  });

  test('weak value → passwordRules error array', async ({ page }) => {
    await page.getByTestId('pwd-reactive').fill('abc');
    await expect(page.getByTestId('form-status')).toHaveText('INVALID');
    const errs = await page.getByTestId('form-errors').innerText();
    expect(errs).toContain('passwordRules');
    expect(errs).toContain('length');
    expect(errs).toContain('upper');
    expect(errs).toContain('digit');
    expect(errs).toContain('special');
  });

  test('value with a space adds noSpace key', async ({ page }) => {
    await page.getByTestId('pwd-reactive').fill('Abc def 1!');
    const errs = await page.getByTestId('form-errors').innerText();
    expect(errs).toContain('noSpace');
  });

  test('fully valid value → no error, form VALID', async ({ page }) => {
    await page.getByTestId('pwd-reactive').fill('Aaaaaaaaaaa1!'); // 13 chars, all rules met
    await expect(page.getByTestId('form-status')).toHaveText('VALID');
    await expect(page.getByTestId('form-errors')).toHaveText('null');
  });

  test('exceeding maxLength keeps length error', async ({ page }) => {
    await page.getByTestId('pwd-reactive').fill('Aaaaaaaaaaaaaaaaaaaaaaaa1!'); // 26 chars > 20
    const errs = await page.getByTestId('form-errors').innerText();
    expect(errs).toContain('passwordRules');
    expect(errs).toContain('length');
  });
});
