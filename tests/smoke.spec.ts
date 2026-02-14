import { test, expect } from '@playwright/test';

/**
 * Smoke testleri – uygulama açılıyor mu, giriş ekranı görünüyor mu?
 * Plan dokümanı Bölüm 3 (A–G) akışlarının otomatik kısmı burada genişletilebilir.
 */

test.describe('OxideSpace Smoke', () => {
  test('sayfa açılır ve giriş ekranı görünür', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=OxideSpace').first()).toBeVisible({ timeout: 15000 });
  });

  test('giriş formu elemanları var', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder(/ornek@oxide|email/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /giriş yap|kayıt ol/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('title ve root yüklü', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Oxide|oxide/i);
    await expect(page.locator('#root')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Giriş sonrası (test hesabı gerekli)', () => {
  test.skip(!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD, 'E2E_TEST_EMAIL ve E2E_TEST_PASSWORD tanımlı değil');

  test('giriş yapınca ana arayüz açılır', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/ornek@oxide|email/i).fill(process.env.E2E_TEST_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.E2E_TEST_PASSWORD!);
    await page.getByRole('button', { name: /giriş yap/i }).click();
    await expect(page.locator('text=Mesajlar').first()).toBeVisible({ timeout: 15000 });
  });
});
