import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page renders and has Google sign-in button', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Sign In — Forvado/)
    await expect(page.getByText('Forvado')).toBeVisible()
    await expect(page.getByText('Football Tournament Tracker')).toBeVisible()
    // Google OAuth button should be present
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible()
  })

  test('unauthenticated users are redirected to login from dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/)
  })

  test('unauthenticated users are redirected to login from tournaments', async ({ page }) => {
    await page.goto('/tournaments')
    await expect(page).toHaveURL(/login/)
  })

  test('unauthenticated users are redirected from team pages', async ({ page }) => {
    await page.goto('/teams')
    await expect(page).toHaveURL(/login/)
  })
})
