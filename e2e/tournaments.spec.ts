import { test, expect } from '@playwright/test'

/**
 * E2E tests for tournament pages.
 * Public tournament pages require authentication.
 */

test.describe('Tournament Pages (unauthenticated)', () => {
  test('redirects /tournaments to login', async ({ page }) => {
    await page.goto('/tournaments')
    await expect(page).toHaveURL(/login/)
  })

  test('redirects /tournaments/new to login', async ({ page }) => {
    await page.goto('/tournaments/new')
    await expect(page).toHaveURL(/login/)
  })
})

test.describe('Navigation', () => {
  test('login page has correct title', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Sign In — Forvado/)
  })

  test('returns 404-style redirect for invalid match ID', async ({ page }) => {
    await page.goto('/matches/nonexistent-match-id-xyz')
    // Should redirect to login (unauthenticated)
    await expect(page).toHaveURL(/login/)
  })
})
