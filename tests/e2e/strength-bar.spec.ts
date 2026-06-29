import { expect, test, type Locator, type Page } from '@playwright/test';

const COLORS = {
  weak:   'rgb(239, 68, 68)',   // #ef4444
  fair:   'rgb(249, 115, 22)',  // #f97316
  good:   'rgb(251, 191, 36)',  // #fbbf24
  strong: 'rgb(34, 197, 94)',   // #22c55e
  empty:  'rgb(226, 232, 240)', // #e2e8f0
};

async function expectSegmentColors(section: Locator, expected: string[]) {
  const segs = section.locator('.nps-bar-seg');
  await expect(segs).toHaveCount(expected.length);
  for (let i = 0; i < expected.length; i++) {
    await expect(segs.nth(i)).toHaveCSS('background-color', expected[i]);
  }
}

async function fillDefault(page: Page, value: string) {
  await page.getByTestId('pwd-default').fill(value);
}

test.describe('Strength bar progression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('no bars lit when below minLength', async ({ page }) => {
    await fillDefault(page, 'Ab!1');
    const section = page.getByTestId('section-default');
    await expectSegmentColors(section, [
      COLORS.empty,
      COLORS.empty,
      COLORS.empty,
      COLORS.empty,
    ]);
    await expect(section.locator('.nps-label')).toHaveText('');
  });

  test('Weak label + 1 segment when length met but only one strength rule satisfied', async ({
    page,
  }) => {
    await fillDefault(page, 'aaaaaaaaaaaa');
    const section = page.getByTestId('section-default');
    await expect(section.locator('.nps-label')).toHaveText('Weak');
    await expectSegmentColors(section, [
      COLORS.weak,
      COLORS.empty,
      COLORS.empty,
      COLORS.empty,
    ]);
  });

  test('Fair label when two strength rules met', async ({ page }) => {
    await fillDefault(page, 'Aaaaaaaaaaaa');
    const section = page.getByTestId('section-default');
    await expect(section.locator('.nps-label')).toHaveText('Fair');
    await expectSegmentColors(section, [
      COLORS.fair,
      COLORS.fair,
      COLORS.empty,
      COLORS.empty,
    ]);
  });

  test('Good label when three of four strength rules met', async ({ page }) => {
    await fillDefault(page, 'Aaaaaaaaaaa1');
    const section = page.getByTestId('section-default');
    await expect(section.locator('.nps-label')).toHaveText('Good');
    await expectSegmentColors(section, [
      COLORS.good,
      COLORS.good,
      COLORS.good,
      COLORS.empty,
    ]);
  });

  test('Strong label + 4 green segments + green label color when all rules met', async ({
    page,
  }) => {
    await fillDefault(page, 'Aaaaaaaaaaa1!');
    const section = page.getByTestId('section-default');
    await expect(section.locator('.nps-label')).toHaveText('Strong');
    await expectSegmentColors(section, [
      COLORS.strong,
      COLORS.strong,
      COLORS.strong,
      COLORS.strong,
    ]);
    await expect(section.locator('.nps-label')).toHaveCSS('color', COLORS.strong);
  });
});
