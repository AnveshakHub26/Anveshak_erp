/**
 * Playwright Global Setup — Pre-warms all Next.js pages before the test suite runs.
 * This eliminates cold-start compilation delays (10-30s on first page visit in dev mode).
 */
import { chromium } from '@playwright/test';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseURL = 'http://localhost:3000';
  const pagesToWarm = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/registration-status',
    '/profile',
    '/search',
    '/notifications',
    '/support',
    '/unauthorized',
    '/documents/warmup-uuid',
  ];

  console.log('[globalSetup] Pre-warming Next.js pages...');
  for (const path of pagesToWarm) {
    try {
      await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      console.log(`[globalSetup] ✓ Warmed: ${path}`);
    } catch (err) {
      console.log(`[globalSetup] ⚠ Skipped (non-critical): ${path}`);
    }
  }

  await browser.close();
  console.log('[globalSetup] All pages warmed. Test suite starting...');
}

export default globalSetup;
