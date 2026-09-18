import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('Main Dashboard and Filter Bar', async ({ page }) => {
    await page.goto('/');

    // Wait for map and markers to be fully loaded
    await page.waitForSelector('.leaflet-container', { state: 'visible' });
    
    // Ensure the filter pills are visible
    await page.waitForSelector('button:has-text("הכל")');

    // Take a full page screenshot and compare with baseline
    // Using a threshold to account for slight map rendering differences
    await expect(page).toHaveScreenshot('main-dashboard.png', {
      maxDiffPixelRatio: 0.05,
      fullPage: true,
    });
  });

  test('Floating Map Card (Asset Details)', async ({ page }) => {
    await page.goto('/');

    // Wait for markers to appear
    await page.waitForSelector('.leaflet-marker-icon', { state: 'visible' });
    
    // Click the first marker to open the FloatingMapCard
    const markers = page.locator('.leaflet-marker-icon');
    await markers.first().click({ force: true });

    // Wait for the Floating Map Card to appear (checking for the Close button 'X')
    await page.waitForSelector('button:has(svg.lucide-x)', { state: 'visible' });
    // Also wait a moment for any CSS animations to finish
    await page.waitForTimeout(1000);

    // Take a screenshot of the entire page with the card open
    await expect(page).toHaveScreenshot('floating-map-card.png', {
      maxDiffPixelRatio: 0.05,
      fullPage: true,
    });
  });
});
