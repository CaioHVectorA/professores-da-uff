import type { Page } from "puppeteer";

export async function signIn(page: Page) {
    // Wait for nav-links to be available and click on the 4th one (index 3)
    await page.waitForSelector('.nav-link');
    await Bun.sleep(1000);

    const navLinks = await page.$$('.nav-link');
    if (navLinks[3]) {
        await navLinks[3].click();
    }

    // Wait after clicking nav-link
    await Bun.sleep(2000);

    // Wait for username input and type
    await page.waitForSelector('#username');
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