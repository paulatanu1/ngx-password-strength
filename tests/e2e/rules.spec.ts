import { expect, test, type Locator } from '@playwright/test';

async function getRule(section: Locator, label: string): Promise<Locator> {
  return section.locator('.nps-req-item', { hasText: label });
}

async function expectMet(item: Locator, met: boolean) {
  const icon = item.locator('.nps-req-icon');
  if (met) {
    await expect(icon).toHaveClass(/\bmet\b/);
    await expect(icon).toHaveText('✓');
  } else {
    await expect(icon).not.toHaveClass(/\bmet\b/);
    await expect(icon).toHaveText('○');
  }
}

test.describe('Rule checklist toggles as password changes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('empty password → all rules unmet', async ({ page }) => {
    const section = page.getByTestId('section-default');
    const items = section.locator('.nps-req-item');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      await expectMet(items.nth(i), false);
    }
  });

  test('uppercase rule flips when an uppercase char is added', async ({ page }) => {
    const section = page.getByTestId('section-default');
    const upperRule = await getRule(section, 'uppercase');
    await page.getByTestId('pwd-default').fill('abcdefghijk1!');
    await expectMet(upperRule, false);
    await page.getByTestId('pwd-default').fill('Abcdefghijk1!');
    await expectMet(upperRule, true);
  });

  test('digit rule flips when a digit is added', async ({ page }) => {
    const section = page.getByTestId('section-default');
    const digitRule = await getRule(section, 'digit');
    await page.getByTestId('pwd-default').fill('Abcdefghijkl!');
    await expectMet(digitRule, false);
    await page.getByTestId('pwd-default').fill('Abcdefghijk1!');
    await expectMet(digitRule, true);
  });

  test('special rule flips when a non-alphanumeric is added', async ({ page }) => {
    const section = page.getByTestId('section-default');
    const specialRule = await getRule(section, 'special');
    await page.getByTestId('pwd-default').fill('Abcdefghijk12');
    await expectMet(specialRule, false);
    await page.getByTestId('pwd-default').fill('Abcdefghijk1!');
    await expectMet(specialRule, true);
  });

  test('length rule respects min and max boundaries', async ({ page }) => {
    const section = page.getByTestId('section-default');
    const lengthRule = await getRule(section, 'Between');
    await page.getByTestId('pwd-default').fill('Abc1!');
    await expectMet(lengthRule, false);
    await page.getByTestId('pwd-default').fill('Abcdefghijk1!');
    await expectMet(lengthRule, true);
    await page.getByTestId('pwd-default').fill('AbcdefghijklmnopqrstuvwxyZ1!'); // 28 chars > max 20
    await expectMet(lengthRule, false);
  });

  test('noSpace rule flips when a space is added', async ({ page }) => {
    const section = page.getByTestId('section-default');
    const noSpaceRule = await getRule(section, 'No spaces');
    await page.getByTestId('pwd-default').fill('Abcdefghijk1!');
    await expectMet(noSpaceRule, true);
    await page.getByTestId('pwd-default').fill('Abcdefghi k1!');
    await expectMet(noSpaceRule, false);
  });

  test('email containment rule blocks email + local part', async ({ page }) => {
    const section = page.getByTestId('section-custom');
    const emailRule = await getRule(section, 'email');
    // password contains "alice" (email local part)
    await page.getByTestId('pwd-custom').fill('Alice!secret');
    await expectMet(emailRule, false);
    // password contains the full email
    await page.getByTestId('pwd-custom').fill('alice@example.com!X');
    await expectMet(emailRule, false);
    // clean password
    await page.getByTestId('pwd-custom').fill('SecureP@ssword');
    await expectMet(emailRule, true);
  });

  test('username containment rule blocks username', async ({ page }) => {
    const section = page.getByTestId('section-custom');
    const userRule = await getRule(section, 'username');
    await page.getByTestId('pwd-custom').fill('SecureP@ssword');
    await expectMet(userRule, true);
    await page.getByTestId('pwd-custom').fill('SecureALICEpass!');
    await expectMet(userRule, false);
  });
});
