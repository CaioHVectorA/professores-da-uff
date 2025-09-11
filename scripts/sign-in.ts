import type { Page } from "puppeteer";

export async function signIn(page: Page) {
    // Wait for username input and type
    await page.waitForSelector('#username', { timeout: 10000 });
    await Bun.sleep(500);
    await page.type('#username', process.env.Q_USERNAME || '');

    // Wait a bit and type password
    await Bun.sleep(500);
    await page.type('#password', process.env.PASSWORD || '');

    // Wait before clicking login button
    await Bun.sleep(1000);
    await page.click('#kc-login');

    // Wait a moment for page to load after login
    console.log('🔐 Successfully signed in');
    await Bun.sleep(2000);
}