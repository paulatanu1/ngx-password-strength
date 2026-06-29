import { expect, test } from '@playwright/test';

test.describe('PasswordStrengthComponent · render', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders three demo sections each with bar + requirements', async ({ page }) => {
    for (const id of ['section-default', 'section-custom', 'section-reactive']) {
      const section = page.getByTestId(id);
      await expect(section).toBeVisible();
      // 4 strength segments per instance
      await expect(section.locator('.nps-bar-seg')).toHaveCount(4);
      // requirements list visible
      await expect(section.locator('.nps-req-list')).toBeVisible();
    }
  });

  test('default config exposes 6 rules (length, noSpace, upper, lower, special, digit)', async ({
    page,
  }) => {
    const items = page.getByTestId('section-default').locator('.nps-req-item');
    await expect(items).toHaveCount(6);
    await expect(items.nth(0)).toContainText('Between 12 and 20 characters');
    await expect(items.nth(1)).toContainText('No spaces allowed');
    await expect(items.nth(2)).toContainText('uppercase');
    await expect(items.nth(3)).toContainText('lowercase');
    await expect(items.nth(4)).toContainText('special');
    await expect(items.nth(5)).toContainText('digit');
  });

  test('custom config drops digit rule and adds email + username rules', async ({ page }) => {
    const items = page.getByTestId('section-custom').locator('.nps-req-item');
    const labels = await items.allInnerTexts();
    const joined = labels.join('\n');
    expect(joined).toContain('Between 8 and 30 characters');
    expect(joined).not.toContain('At least 1 digit');
    expect(joined).toContain('email');
    expect(joined).toContain('username');
  });

  test('strength label is empty before minLength reached', async ({ page }) => {
    await page.getByTestId('pwd-default').fill('Short1!');
    const label = page.getByTestId('section-default').locator('.nps-label');
    await expect(label).toHaveText('');
  });
});
