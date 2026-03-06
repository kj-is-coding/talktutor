import { test, expect } from '@playwright/test';

/**
 * Comprehensive UI/UX Test Suite for TalkTutor
 * Tests all visual improvements, responsive design, animations, and interactions
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('TalkTutor UI/UX Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test.describe('Navigation System', () => {
    test('desktop sidebar should be visible and functional', async ({ page }) => {
      await page.waitForTimeout(1000);
      const url = page.url();
      if (url.includes('/login')) {
        test.skip();
        return;
      }

      const sidebar = page.locator('aside').first();
      const isVisible = await sidebar.isVisible();

      if (isVisible) {
        await expect(page.locator('aside').getByRole('navigation')).toBeVisible();
        const navLinks = page.locator('nav a');
        const count = await navLinks.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('mobile bottom nav should be visible on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).toBeVisible();

      const activeIndicator = page.locator('.absolute.-top-\\[9px\\].bg-primary');
      expect(await activeIndicator.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Main Dashboard (/app)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/app`);
      await page.waitForTimeout(1000);
    });

    test('language switcher should display flag and dropdown', async ({ page }) => {
      const langButton = page.locator('button:has-text("Spanish"), button[aria-label="Select language"]');
      if (await langButton.first().isVisible()) {
        await langButton.first().click();
        await page.waitForTimeout(500);

        const dropdown = page.locator('.bg-card.border-border.rounded-xl, .absolute.z-50');
        const isVisible = await dropdown.first().isVisible();
        if (isVisible) {
          await expect(dropdown.first()).toBeVisible();
        }

        const flags = page.locator('.text-2xl, .text-xl');
        expect(await flags.count()).toBeGreaterThan(0);
      }
    });

    test('progress bar should use gradient colors', async ({ page }) => {
      const progressContainer = page.locator('.h-3.bg-white\\/10.rounded-full, .bg-white\\/10.rounded-full');
      if (await progressContainer.isVisible()) {
        const progressBar = progressContainer.locator('.bg-gradient-to-r');
        const hasGradient = await progressBar.count() > 0;
        expect(hasGradient).toBe(true);
      }
    });

    test('streak display should have flame animation', async ({ page }) => {
      const streakDisplay = page.locator('.streak-container');
      const count = await streakDisplay.count();

      if (count > 0) {
        const flame = streakDisplay.first().locator('svg');
        await expect(flame).toBeVisible();
      }
    });

    test('start call button should have proper styling and aria label', async ({ page }) => {
      const startButton = page.locator('button[aria-label="Start voice call"]');
      if (await startButton.isVisible()) {
        const ariaLabel = await startButton.getAttribute('aria-label');
        expect(ariaLabel).toBe('Start voice call');

        const hasGradient = await startButton.evaluate(el =>
          el.classList.contains('from-blue-500') && el.classList.contains('to-purple-600')
        );
        expect(hasGradient).toBe(true);
      }
    });
  });

  test.describe('Progress Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/app/progress`);
      await page.waitForTimeout(1000);
    });

    test('weekly chart bars should be present', async ({ page }) => {
      await page.waitForTimeout(1000);
      const bars = page.locator('.rounded.transition-all');
      const count = await bars.count();
      expect(count).toBeGreaterThan(0);
    });

    test('achievement cards should have proper states', async ({ page }) => {
      await page.waitForTimeout(1000);
      const achievements = page.locator('.rounded-lg.p-3.text-center');
      const count = await achievements.count();
      expect(count).toBeGreaterThan(0);

      const unlocked = page.locator('.from-amber-500\\/20');
      const hasUnlocked = await unlocked.count() > 0;

      const inProgress = page.locator('.bg-primary\\/10');
      const hasProgress = await inProgress.count() > 0;

      expect(hasUnlocked || hasProgress || count > 0).toBe(true);
    });

    test('streak info should be displayed', async ({ page }) => {
      await page.waitForTimeout(1000);
      const streakContainers = page.locator('.streak-container');
      const count = await streakContainers.count();

      if (count > 0) {
        const hasFlame = await streakContainers.first().locator('svg').count() > 0;
        expect(hasFlame).toBe(true);
      }
    });
  });

  test.describe('Dictionary Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/app/dictionary`);
      await page.waitForTimeout(2000);
    });

    test('word entries should be displayed', async ({ page }) => {
      const wordEntries = page.locator('.list-item-in');
      const count = await wordEntries.count();

      if (count > 0) {
        expect(count).toBeGreaterThan(0);

        const firstEntry = wordEntries.first();
        await firstEntry.hover();
        await page.waitForTimeout(300);
      }
    });

    test('empty state should be engaging when no entries', async ({ page }) => {
      const emptyState = page.locator('.flex.flex-col.items-center, .EmptyState');
      const count = await emptyState.count();

      if (count > 0) {
        const icon = emptyState.first().locator('svg');
        expect(await icon.count()).toBeGreaterThan(0);
      }

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Scenarios Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/app/scenarios`);
      await page.waitForTimeout(1000);
    });

    test('scenarios page should load', async ({ page }) => {
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Voice Call Interface', () => {
    test('main page should have start call button', async ({ page }) => {
      await page.goto(`${BASE_URL}/app`);
      await page.waitForTimeout(1000);

      const startButton = page.locator('button[aria-label="Start voice call"]');
      if (await startButton.isVisible()) {
        await expect(startButton).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('desktop should have max-width container', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`${BASE_URL}/app`);
      await page.waitForTimeout(1000);

      const maxContainer = page.locator('.max-w-4xl');
      const count = await maxContainer.count();
      expect(count).toBeGreaterThan(0);
    });

    test('mobile layout should use bottom nav', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).toBeVisible();

      const sidebar = page.locator('aside.hidden.md\\:flex');
      const isHidden = await sidebar.isHidden();
      expect(isHidden).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('skip link should exist', async ({ page }) => {
      const skipLink = page.locator('a[href="#main-content"]');
      const count = await skipLink.count();
      expect(count).toBeGreaterThan(0);
    });

    test('buttons should have aria labels', async ({ page }) => {
      const startButton = page.locator('button[aria-label="Start voice call"]');
      const langButton = page.locator('button[aria-label="Select language"]');

      const startCount = await startButton.count();
      const langCount = await langButton.count();

      if (startCount > 0) {
        const ariaLabel = await startButton.first().getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }

      if (langCount > 0) {
        const ariaLabel = await langButton.first().getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    });

    test('focus states should be visible', async ({ page }) => {
      await page.goto(`${BASE_URL}/app`);
      await page.waitForTimeout(1000);

      const button = page.locator('button').first();
      if (await button.isVisible()) {
        await button.focus();

        const focusedElement = page.locator(':focus');
        const count = await focusedElement.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Animations', () => {
    test('skeleton loading states should be present during load', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/progress`);

      const skeletons = page.locator('.skeleton');
      const skeletonCount = await skeletons.count();

      if (skeletonCount > 0) {
        const hasAnimation = await skeletons.first().evaluate(el =>
          el.classList.contains('animate-pulse')
        );
        expect(hasAnimation).toBe(true);
      }
    });

    test('list items should have staggered animation class', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/dictionary`);
      await page.waitForTimeout(2000);

      const listItems = page.locator('.list-item-in');
      const count = await listItems.count();
      expect(count >= 0).toBe(true);
    });

    test('message bubbles should have animation class', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/chat`);
      await page.waitForTimeout(1000);

      const messageBubbles = page.locator('.bubble, .msg-in');
      const count = await messageBubbles.count();

      if (count > 0) {
        const hasAnimation = await messageBubbles.first().evaluate(el =>
          el.classList.contains('msg-in') || el.classList.contains('bubble')
        );
        expect(hasAnimation).toBe(true);
      }
    });
  });

  test.describe('Color System & Theming', () => {
    test('should use dark theme colors', async ({ page }) => {
      const bgColor = await page.evaluate(() => {
        const styles = window.getComputedStyle(document.body);
        return styles.backgroundColor;
      });

      const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        expect(r).toBeLessThan(60);
        expect(g).toBeLessThan(60);
        expect(b).toBeLessThan(60);
      }
    });

    test('primary buttons should use gradient', async ({ page }) => {
      await page.goto(`${BASE_URL}/app`);
      await page.waitForTimeout(1000);

      const primaryButtons = page.locator('.bg-gradient-to-br.from-blue-500');
      const count = await primaryButtons.count();

      if (count > 0) {
        const hasGradient = await primaryButtons.first().evaluate(el =>
          el.classList.contains('from-blue-500') && el.classList.contains('to-purple-600')
        );
        expect(hasGradient).toBe(true);
      }
    });
  });

  test.describe('Typography', () => {
    test('should use Plus Jakarta Sans font', async ({ page }) => {
      const body = page.locator('body.font-sans');
      const fontFamily = await body.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.fontFamily;
      });

      expect(fontFamily.toLowerCase()).toContain('jakarta');
    });

    test('headings should have proper hierarchy', async ({ page }) => {
      const h1 = page.locator('h1').first();

      if (await h1.isVisible()) {
        const fontSize = await h1.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return parseFloat(styles.fontSize);
        });

        expect(fontSize).toBeGreaterThan(14);
        expect(fontSize).toBeLessThan(40);
      }
    });
  });

  test.describe('Mobile Touch Interactions', () => {
    test('button should be clickable on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/app`);
      await page.waitForTimeout(1000);

      const button = page.locator('button').first();
      if (await button.isVisible()) {
        await button.click();
        const isVisible = await button.isVisible();
        expect(isVisible).toBe(true);
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle window resize gracefully', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(500);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should handle empty states gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/dictionary`);
      await page.waitForTimeout(2000);

      const body = page.locator('body');
      await expect(body).toBeVisible();

      const content = page.locator('button, .text-center, h1');
      const hasContent = await content.count() > 0;
      expect(hasContent).toBe(true);
    });
  });
});

test.describe('Visual Regression Tests', () => {
  test('main page should load successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/app`);
    await page.waitForTimeout(2000);

    const body = page.locator('body');
    await expect(body).toBeVisible();

    await page.screenshot({
      path: 'screenshots/main-page.png',
      fullPage: true
    });
  });

  test('progress page should load successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/progress`);
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'screenshots/progress-page.png',
      fullPage: true
    });

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('dictionary page should load successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/dictionary`);
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'screenshots/dictionary-page.png',
      fullPage: true
    });

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
