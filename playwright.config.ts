import { defineConfig, devices } from '@playwright/test';

/**
 * E2E testleri: Uygulama http://localhost:5173 üzerinde çalışıyor olmalı
 * veya webServer ile otomatik başlatılır.
 * Supabase/LiveKit için .env gerekli; gerçek giriş testi için E2E_TEST_EMAIL / E2E_TEST_PASSWORD kullanılabilir.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
