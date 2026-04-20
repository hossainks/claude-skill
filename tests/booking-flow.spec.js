import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const USER_EMAIL = 'admin@test.com';
const USER_PASSWORD = 'TestXacfub123%';

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('you@email.com').fill(USER_EMAIL);
  await page.getByLabel('Password').fill(USER_PASSWORD);
  await page.locator('#login-btn').click();
  await expect(page.getByTestId('logout-btn')).toBeVisible();  // Fix #3: Priority 1 testid over role
}

test.describe('Booking Flow', () => {

  // TC-001: Full journey for a single-ticket booking on a static event.
  // Covers: /events → /events/:id → form submit → confirmation card, booking ref prefix rule.
  test('TC-001: Book a single ticket on a static event and see confirmation card', async ({ page }) => {
    // -- Step 1: Login --
    await login(page);

    // -- Step 2: Navigate to World Tech Summit via events list (title starts with "W") --
    await page.goto(`${BASE_URL}/events`);
    await page.getByTestId('event-card').filter({ hasText: 'World Tech Summit' }).getByTestId('book-now-btn').click();  // Fix #1: no hardcoded ID
    await expect(page.getByRole('heading', { name: 'World Tech Summit' })).toBeVisible();

    // -- Step 3: Fill booking form (quantity = 1 by default) --
    await page.getByLabel('Full Name').fill('Test User');  // Fix #2: Priority 3 label over placeholder
    await page.getByTestId('customer-email').fill(USER_EMAIL);  // Fix #5: Priority 1 testid over #id
    await page.getByPlaceholder('+91 98765 43210').fill('9876543210');

    // -- Step 4: Submit booking --
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // -- Step 5: Assert confirmation card is shown --
    await expect(page.getByText('Booking Confirmed!')).toBeVisible();

    // -- Step 6: Assert booking ref matches "W-XXXXXX" format (first letter = event title first char) --
    const bookingRef = await page.locator('.booking-ref').textContent();
    console.log(`TC-001 Booking ref: ${bookingRef}`);
    expect(bookingRef).toMatch(/^W-[A-Z0-9]{6}$/);

    // -- Step 7: Assert customer name appears on confirmation --
    await expect(page.getByText('Test User')).toBeVisible();
  });

  // TC-002: Multi-ticket booking using the quantity stepper.
  // Covers: + button increments quantity, confirmation card reflects correct quantity and D-prefixed ref.
  test('TC-002: Book 3 tickets using the quantity stepper and verify confirmation card', async ({ page }) => {
    // -- Step 1: Login --
    await login(page);

    // -- Step 2: Navigate to Dilli Diwali Mela via events list (title starts with "D") --
    await page.goto(`${BASE_URL}/events`);
    await page.getByTestId('event-card').filter({ hasText: 'Dilli Diwali Mela' }).getByTestId('book-now-btn').click();  // Fix #1: no hardcoded ID
    await expect(page.getByRole('heading', { name: 'Dilli Diwali Mela' })).toBeVisible();

    // -- Step 3: Increment quantity to 3 using the + button --
    await page.getByRole('button', { name: '+' }).click();
    await page.getByRole('button', { name: '+' }).click();
    await expect(page.locator('#ticket-count')).toHaveText('3');

    // -- Step 4: Fill booking form --
    await page.getByLabel('Full Name').fill('Test User');  // Fix #2: Priority 3 label over placeholder
    await page.getByTestId('customer-email').fill(USER_EMAIL);  // Fix #5: Priority 1 testid over #id
    await page.getByPlaceholder('+91 98765 43210').fill('9876543210');

    // -- Step 5: Submit booking --
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // -- Step 6: Assert confirmation card is shown with correct ref prefix --
    await expect(page.getByText('Booking Confirmed!')).toBeVisible();
    const bookingRef = await page.locator('.booking-ref').textContent();
    console.log(`TC-002 Booking ref: ${bookingRef}`);
    expect(bookingRef).toMatch(/^D-[A-Z0-9]{6}$/);

    // -- Step 7: Assert quantity "3" is shown in the Tickets row of the confirmation card --
    const ticketsRow = page.getByText('Tickets', { exact: true }).locator('..');  // Fix #4: exact match isolates the Tickets label span; .. scopes to its row
    await expect(ticketsRow).toContainText('3');
  });

  // TC-003: Bookings list rendering after a successful booking.
  // Covers: /bookings page load, booking card structure, "confirmed" badge, View Details link.
  test('TC-003: Bookings list shows cards with confirmed status badge and View Details link', async ({ page }) => {
    // -- Step 1: Login and create a booking so the list is non-empty --
    await login(page);
    await page.goto(`${BASE_URL}/events`);
    await page.getByTestId('event-card').filter({ hasText: 'Hollywood Monsoon Night' }).getByTestId('book-now-btn').click();  // Fix #1: no hardcoded ID
    await expect(page.getByRole('heading', { name: /Hollywood Monsoon Night/i })).toBeVisible();
    await page.getByLabel('Full Name').fill('Test User');  // Fix #2
    await page.getByTestId('customer-email').fill(USER_EMAIL);  // Fix #5
    await page.getByPlaceholder('+91 98765 43210').fill('9876543210');
    await page.getByRole('button', { name: 'Confirm Booking' }).click();
    await expect(page.getByText('Booking Confirmed!')).toBeVisible();

    // -- Step 2: Navigate to bookings list via confirmation card link --
    await page.getByRole('link', { name: 'View My Bookings' }).click();
    await expect(page).toHaveURL(`${BASE_URL}/bookings`);

    // -- Step 3: Assert page heading --
    await expect(page.getByRole('heading', { name: 'My Bookings' })).toBeVisible();

    // -- Step 4: Assert at least one booking card is visible with "confirmed" status badge --
    const firstCard = page.getByTestId('booking-card').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByText('confirmed')).toBeVisible();

    // -- Step 5: Assert View Details link is present on the card --
    await expect(firstCard.getByRole('link', { name: 'View Details' })).toBeVisible();
  });

});
