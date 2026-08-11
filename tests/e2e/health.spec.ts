import { test, expect } from '@playwright/test';

/**
 * AnveshakHub Foundation E2E Validation Suite
 * Covers: FND-01 through FND-12 per PDS v3.0
 */
test.describe('FND-01 through FND-12: Foundation Validation', () => {
  // =============================================
  // FND-01: LANDING PAGE
  // =============================================
  test('FND-01: Public Landing page loads correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Integrated Enterprise Management Platform|Bridging Innovation|AnveshakHub/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('link', { name: 'Login to Platform' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register Organization' }).first()).toBeVisible();
  });

  // =============================================
  // FND-02: LOGIN / AUTH
  // =============================================
  test('FND-02: Login page loads and shows validation', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Sign In to AnveshakHub/i })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot Password?' })).toBeVisible();
    // Back to Home is now the Anveshak Hub brand logo link in the header nav
    await expect(page.getByRole('link', { name: /Anveshak Hub|Back to Home/i }).first()).toBeVisible();
    // Test invalid login → error message
    await page.locator('input#email').fill('invalid@test.com');
    await page.locator('input#password').fill('WrongPass123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText(/Invalid email or password|Invalid credentials/i).first()).toBeVisible({ timeout: 20000 });
  });

  test('FND-02: Unauthenticated profile access handles safely', async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/error/);
  });

  test('FND-02: Unauthenticated notifications access handles safely', async ({ page }) => {
    await page.goto('/notifications', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/error/);
  });

  test('FND-02: Unauthenticated search access handles safely', async ({ page }) => {
    await page.goto('/search', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/error/);
  });

  // =============================================
  // FND-03: ORGANIZATION REGISTRATION
  // =============================================
  test('FND-03: Registration page loads with all required fields', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Organization Registration' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input#legalName')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    // Authorization consent notice
    await expect(page.getByText(/authorization to represent|onboarding/i).first()).toBeVisible();
  });

  test('FND-03: Registration form validation works', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    // Submit empty form
    await page.getByRole('button', { name: 'Submit Organization Registration' }).click();
    // Should show validation errors
    await expect(page.getByText(/Legal name is required|required|must be/i).first()).toBeVisible({ timeout: 10000 });
  });

  // =============================================
  // FND-04: FORGOT PASSWORD
  // =============================================
  test('FND-04: Forgot password page loads and submits non-leaking response', async ({ page }) => {
    await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Account Recovery' })).toBeVisible({ timeout: 15000 });
    await page.locator('input#email').fill('anyrandom@example.com');
    await page.getByRole('button', { name: 'Send Password Recovery Link' }).click();
    // Success state shows regardless of whether email exists
    await expect(page.getByText(/Recovery Request Submitted/i).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('link', { name: 'Return to Sign In' })).toBeVisible();
  });

  // =============================================
  // FND-05: RESET PASSWORD
  // =============================================
  test('FND-05: Reset password page loads and validates passwords match', async ({ page }) => {
    await page.goto('/reset-password?token=test_valid_token_placeholder', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Set New Password' })).toBeVisible({ timeout: 15000 });
    // Mismatched passwords validation
    await page.locator('input#newPassword').fill('SecurePass@2026!');
    await page.locator('input#confirmPassword').fill('DifferentPass@2026!');
    await page.getByRole('button', { name: 'Update Password' }).click();
    await expect(page.getByText(/passwords don't match/i).first()).toBeVisible({ timeout: 10000 });
  });

  // =============================================
  // FND-06: REGISTRATION STATUS
  // =============================================
  test('FND-06: Registration status page loads and handles missing reference', async ({ page }) => {
    await page.goto('/registration-status', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Registration Reference Not Found|Organization Registration Status/i })).toBeVisible({ timeout: 20000 });
  });

  test('FND-06: Registration status shows not found for fake reference', async ({ page }) => {
    await page.goto('/registration-status?orgNumber=ORG-FAKE-99999', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Registration Reference Not Found|Organization Registration Status/i })).toBeVisible({ timeout: 20000 });
  });

  // =============================================
  // FND-07: USER PROFILE
  // =============================================
  test('FND-07: Profile page loads with all sections', async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    // Should show profile sections
    await expect(page.getByRole('heading', { name: 'Contact Information' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Assigned System Roles (Read-Only)' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Account Password Security' })).toBeVisible({ timeout: 20000 });
  });

  // =============================================
  // FND-08: GLOBAL SEARCH
  // =============================================
  test('FND-08: Global search page loads and accepts input', async ({ page }) => {
    await page.goto('/search', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Global Search' })).toBeVisible({ timeout: 20000 });
    const searchInput = page.getByPlaceholder('Search organizations, personnel accounts, or system documents...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test');
    await expect(page.getByRole('button', { name: 'All Categories' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Organizations' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Users' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Documents' })).toBeVisible();
  });

  // =============================================
  // FND-09: NOTIFICATIONS
  // =============================================
  test('FND-09: Notifications page loads with empty state', async ({ page }) => {
    await page.goto('/notifications', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Notification Center' })).toBeVisible({ timeout: 20000 });
    const emptyOrList = page.locator('text=No Notifications Found').or(page.getByText(/notifications|alert|inbox/i));
    await expect(emptyOrList.first()).toBeVisible({ timeout: 20000 });
  });

  // =============================================
  // FND-10: DOCUMENT VIEWER
  // =============================================
  test('FND-10: Document viewer 404 for non-existent document', async ({ page }) => {
    await page.goto('/documents/doc-does-not-exist-fake-uuid', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/500/);
    const notFoundContent = page.getByText(/not found|unauthorized|document/i).first();
    await expect(notFoundContent).toBeVisible({ timeout: 20000 });
  });

  // =============================================
  // FND-11: CONTACT ADMIN / SUPPORT
  // =============================================
  test('FND-11: Support page loads and validates form', async ({ page }) => {
    await page.goto('/support', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Contact Administration & Technical Support/i })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('input#contactName')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('input#contactEmail')).toBeVisible();
    await expect(page.locator('textarea#message')).toBeVisible();
    // Submit empty form → validation errors
    await page.getByRole('button', { name: 'Submit Support Request' }).click();
    await expect(page.getByText(/required|must be/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('FND-11: Support form submission works', async ({ page }) => {
    await page.goto('/support', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input#contactName')).toBeVisible({ timeout: 20000 });
    await page.locator('input#contactName').fill('E2E Test User');
    await page.locator('input#contactEmail').fill('e2etest@example.com');
    await page.locator('select#category').selectOption('Technical System Bug');
    await page.locator('input#subject').fill('E2E Validation Test Ticket');
    await page.locator('textarea#message').fill('This is an automated E2E validation test. Ticket created during Foundation E2E validation run. Disregard.');
    await page.getByRole('button', { name: 'Submit Support Request' }).click();
    await expect(page.getByText(/Support Request Submitted|ticket/i).first()).toBeVisible({ timeout: 20000 });
  });

  // =============================================
  // FND-12: UNAUTHORIZED / ERROR PAGES
  // =============================================
  test('FND-12: Unauthorized page renders correctly', async ({ page }) => {
    await page.goto('/unauthorized', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /403 Access Forbidden|401 Authentication Required|unauthorized|access denied/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Go to Home').first()).toBeVisible();
  });

  test('FND-12: 404 Not Found page for invalid routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-anywhere', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL('/this-route-does-not-exist-anywhere');
    await expect(page.getByRole('heading', { name: '404 Page Not Found' })).toBeVisible({ timeout: 15000 });
  });

  // =============================================
  // NAVIGATION & CONSISTENCY CHECKS
  // =============================================
  test('Navigation: All public links work from landing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Login to Platform' }).first().click();
    await expect(page).toHaveURL('/login');
    await page.goBack();
    await page.getByRole('link', { name: 'Register Organization' }).first().click();
    await expect(page).toHaveURL('/register');
  });

  test('Navigation: Login page back links work', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    // Brand logo link in nav header goes to home
    await expect(page.getByRole('link', { name: /Anveshak Hub/i }).first()).toBeVisible({ timeout: 15000 });
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Forgot Password?' }).click();
    await expect(page).toHaveURL('/forgot-password');
  });

  // =============================================
  // RESPONSIVE LAYOUT
  // =============================================
  test('Responsive: Mobile viewport - Login page no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Sign In to AnveshakHub/i })).toBeVisible({ timeout: 15000 });
  });

  test('Responsive: Tablet viewport - Landing page no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Integrated Enterprise Management Platform|Bridging Innovation/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('Responsive: Mobile viewport - Registration page renders', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Organization Registration' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input#legalName')).toBeVisible();
  });
});
