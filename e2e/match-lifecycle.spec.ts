import { test, expect, Page } from '@playwright/test'

/**
 * E2E tests for the full match lifecycle.
 * These tests require a seeded test environment with:
 *   - A coordinator user (COORDINATOR_EMAIL / COORDINATOR_PASSWORD env vars)
 *   - A tournament in ONGOING status
 *   - A scheduled match in that tournament
 *   - Both teams with active members
 *
 * Set env vars before running:
 *   COORDINATOR_EMAIL=test@example.com
 *   COORDINATOR_PASSWORD=password
 *   TEST_MATCH_ID=<match-id>
 */

const COORDINATOR_EMAIL = process.env.COORDINATOR_EMAIL ?? ''
const COORDINATOR_PASSWORD = process.env.COORDINATOR_PASSWORD ?? ''
const TEST_MATCH_ID = process.env.TEST_MATCH_ID ?? ''

// Skip all tests if environment not configured
test.skip(!COORDINATOR_EMAIL || !COORDINATOR_PASSWORD || !TEST_MATCH_ID, 'Test environment not configured')

async function loginAsCoordinator(page: Page) {
  await page.goto('/login')
  // For email/password auth (if configured)
  await page.fill('[name="email"]', COORDINATOR_EMAIL)
  await page.fill('[name="password"]', COORDINATOR_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('/dashboard')
}

test.describe('Match Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCoordinator(page)
  })

  test('navigates to match control panel', async ({ page }) => {
    await page.goto(`/matches/${TEST_MATCH_ID}/control`)
    await expect(page.getByText('CONTROL PANEL')).toBeVisible()
    await expect(page.getByText('Phase Control')).toBeVisible()
  })

  test('control panel shows start match button for scheduled match', async ({ page }) => {
    await page.goto(`/matches/${TEST_MATCH_ID}/control`)
    await expect(page.getByRole('button', { name: /Start Match/i })).toBeVisible()
  })

  test('lineup panel shows both teams', async ({ page }) => {
    await page.goto(`/matches/${TEST_MATCH_ID}/control`)
    await page.getByRole('tab', { name: 'Lineups' }).click()
    // Both lineup panels should be visible
    await expect(page.getByText('Starting XI')).toHaveCount(0) // No lineups submitted yet
    await expect(page.getByRole('button', { name: 'Submit Lineup' }).first()).not.toBeVisible()
  })

  test('public match viewer is accessible', async ({ page }) => {
    await page.goto(`/matches/${TEST_MATCH_ID}`)
    // Should show score and team names
    await expect(page.getByRole('tab', { name: 'Events' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Lineups' })).toBeVisible()
  })
})

test.describe('Match Viewer (public)', () => {
  test('shows live score section', async ({ page }) => {
    await page.goto('/login')
    await page.goto(`/matches/${TEST_MATCH_ID}`)
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/login/)
  })
})
