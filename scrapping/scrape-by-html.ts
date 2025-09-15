import puppeteer, { Page } from 'puppeteer';
import { signIn } from '../scripts/sign-in';
import * as fs from 'fs';
import * as path from 'path';
const MAX_RETRIES = 50;
const BROWSERS_NUM = 5;
const headless = true
const SCRAPING_DIR = './subjects-new-scrapping';

async function scrapePage(page: Page, url: string, allProfessorsMap: Record<string, string[]>): Promise<number> {
    console.log(`[${new Date().toISOString()}] Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for page to stabilize

    // Check if logged in by waiting for table
    try {
        await page.waitForSelector('#tabela-turmas tbody tr', { timeout: 5000 });
    } catch {
        // If not, re-login
        console.log(`[${new Date().toISOString()}] Session expired, re-logging in...`);
        await page.goto('https://app.uff.br/', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await signIn(page);
        await page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.waitForSelector('#tabela-turmas tbody tr', { timeout: 10000 });
    }

    const rows = await page.$$('#tabela-turmas tbody tr');
    let newProfessorsCount = 0;
    console.log(`[${new Date().toISOString()}] Scraping ${rows.length} rows from ${url}`);

    // Collect all subject links and subjects first to avoid context loss
    const subjectsData: { subject: string; href: string }[] = [];
    for (const row of rows) {
        const tds = await row.$$('td');
        if (tds.length < 2) continue;

        const subjectLink = await tds[1]?.$('a');
        if (!subjectLink) continue;
        const subject = await subjectLink.evaluate((el: any) => el.textContent?.trim() || '');
        const href = await subjectLink.evaluate((el: any) => el.href);
        if (subject && href) {
            subjectsData.push({ subject, href });
        }
    }

    // Now process each subject by navigating to its page
    for (const { subject, href } of subjectsData) {
        await page.goto(href, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page to stabilize
        try {
            await page.waitForSelector('#tabela-alteracao-professores-turma tbody tr td:first-child', { timeout: 10000 });
        } catch {
            console.log(`[${new Date().toISOString()}] No professor data found for subject ${subject} at ${href}`);
            continue;
        }
        const professor = await page.$('#tabela-alteracao-professores-turma tbody tr td:first-child')
        const professorName = professor ? await professor.evaluate((el: any) => el.textContent?.trim() || '') : '';
        if (professorName) {
            const professors = professorName.split(',').map((p: string) => p.trim()).filter((p: string) => p);

            for (const prof of professors) {
                if (!allProfessorsMap[prof]) {
                    allProfessorsMap[prof] = [];
                    newProfessorsCount++;
                }
                if (!allProfessorsMap[prof].includes(subject)) {
                    allProfessorsMap[prof].push(subject);
                }
            }
        }
        // Go back to the list page
        await page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log(`[${new Date().toISOString()}] Finished scraping ${url}, new professors found: ${newProfessorsCount}`);
    return newProfessorsCount;
}

async function getLastPage(page: Page): Promise<number> {
    const baseUrl = 'https://app.uff.br/graduacao/quadrodehorarios/?button=&q%5Banosemestre_eq%5D=20252&q%5Bcurso_ferias_eq%5D=&q%5Bdisciplina_cod_departamento_eq%5D=&q%5Bdisciplina_nome_or_disciplina_codigo_cont%5D=&q%5Bidlocalidade_eq%5D=&q%5Bidturmamodalidade_eq%5D=&q%5Bidturno_eq%5D=&q%5Bvagas_turma_curso_idcurso_eq%5D=&page=1';
    console.log(`[${new Date().toISOString()}] Fetching last page number...`);
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for page to stabilize
    await page.waitForSelector('.pagination .page-link', { timeout: 10000 });

    const lastLink = await page.$$('.pagination .page-link[href*="page="]:nth-last-child(-n+1)');
    if (!lastLink) return 1;
    const href = await lastLink[lastLink.length - 1]?.evaluate((el: any) => el.getAttribute('href'));
    const match = href?.match(/page=(\d+)/);
    const lastPage = match ? parseInt(match[1]) : 1;
    console.log(`[${new Date().toISOString()}] Last page found: ${lastPage}`);
    return lastPage;
}

async function scrapeWithBrowser(browserIndex: number, page: Page, lastPage: number, baseUrl: string): Promise<{ map: Record<string, string[]>; pagesProcessed: number }> {
    // Ensure directory exists
    if (!fs.existsSync(SCRAPING_DIR)) {
        fs.mkdirSync(SCRAPING_DIR, { recursive: true });
    }

    const mapFile = path.join(SCRAPING_DIR, `professors-subjects-${browserIndex + 1}.json`);
    const progressFile = path.join(SCRAPING_DIR, `progress-${browserIndex + 1}.json`);

    // Load existing map
    let allProfessorsMap: Record<string, string[]> = {};
    if (fs.existsSync(mapFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(mapFile, 'utf-8'));
            for (const item of data) {
                const prof = Object.keys(item)[0];
                if (prof) {
                    allProfessorsMap[prof] = item[prof];
                }
            }
            console.log(`[${new Date().toISOString()}] Browser ${browserIndex + 1} loaded ${Object.keys(allProfessorsMap).length} existing professors.`);
        } catch (e) {
            console.log(`[${new Date().toISOString()}] Error loading map for browser ${browserIndex + 1}:`, e);
        }
    }

    // Load progress
    let lastProcessedPage = 0;
    if (fs.existsSync(progressFile)) {
        try {
            const progress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
            lastProcessedPage = progress.lastPage || 0;
            console.log(`[${new Date().toISOString()}] Browser ${browserIndex + 1} resuming from page ${lastProcessedPage + BROWSERS_NUM}.`);
        } catch (e) {
            console.log(`[${new Date().toISOString()}] Error loading progress for browser ${browserIndex + 1}:`, e);
        }
    }

    let totalNewProfessors = 0;
    let pagesProcessed = 0;

    for (let pageNum = Math.max(browserIndex + 1, lastProcessedPage + BROWSERS_NUM); pageNum <= lastPage; pageNum += BROWSERS_NUM) {
        const url = `${baseUrl}&page=${pageNum}`;
        const newCount = await scrapePage(page, url, allProfessorsMap);
        console.log(`[${new Date().toISOString()}] Browser ${browserIndex + 1} scraped page ${pageNum}, new professors: ${newCount}`);
        totalNewProfessors += newCount;
        pagesProcessed++;

        // Save progress
        fs.writeFileSync(progressFile, JSON.stringify({ lastPage: pageNum }, null, 2));

        // Save every 20 new professors for this browser
        if (totalNewProfessors >= 20) {
            const result = Object.entries(allProfessorsMap).map(([prof, subjects]) => ({
                [prof]: subjects
            }));
            fs.writeFileSync(mapFile, JSON.stringify(result, null, 2));
            console.log(`[${new Date().toISOString()}] Browser ${browserIndex + 1} saved progress: ${Object.keys(allProfessorsMap).length} professors, ${pagesProcessed} pages processed.`);
            totalNewProfessors = 0; // Reset counter
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Final save for this browser
    const result = Object.entries(allProfessorsMap).map(([prof, subjects]) => ({
        [prof]: subjects
    }));
    fs.writeFileSync(mapFile, JSON.stringify(result, null, 2));

    return { map: allProfessorsMap, pagesProcessed };
}

async function scrapeProfessors() {
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] Starting scraping process with ${BROWSERS_NUM} browsers...`);

    const browsers: any[] = [];
    const pages: any[] = [];

    for (let i = 0; i < BROWSERS_NUM; i++) {
        const browser = await puppeteer.launch({
            headless, protocolTimeout: 60000, defaultViewport: {
                width: 1280,
                height: 800
            }
        });
        browsers.push(browser);
        const page = await browser.newPage();
        pages.push(page);

        // Login on each page
        console.log(`[${new Date().toISOString()}] Logging in on browser ${i + 1}...`);
        await page.goto('https://app.uff.br/graduacao/quadrodehorarios/sessions/new', { waitUntil: 'networkidle2' });
        await signIn(page);
        await page.goto('https://app.uff.br/graduacao/quadrodehorarios/', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for page to stabilize
    }

    try {
        // Get last page using the first page
        const lastPage = await getLastPage(pages[0]);
        console.log(`[${new Date().toISOString()}] Total pages: ${lastPage}`);

        const baseUrl = 'https://app.uff.br/graduacao/quadrodehorarios/?button=&q%5Banosemestre_eq%5D=20252&q%5Bcurso_ferias_eq%5D=&q%5Bdisciplina_cod_departamento_eq%5D=&q%5Bdisciplina_nome_or_disciplina_codigo_cont%5D=&q%5Bidlocalidade_eq%5D=&q%5Bidturmamodalidade_eq%5D=&q%5Bidturno_eq%5D=&q%5Bvagas_turma_curso_idcurso_eq%5D=';

        // Run scraping in parallel for each browser
        const promises = pages.map((page, index) => scrapeWithBrowser(index, page, lastPage, baseUrl));
        const results = await Promise.all(promises);

        // Combine all maps
        const combinedMap: Record<string, string[]> = {};
        let totalPagesProcessed = 0;
        for (const { map, pagesProcessed } of results) {
            for (const [prof, subjects] of Object.entries(map)) {
                if (!combinedMap[prof]) {
                    combinedMap[prof] = [];
                }
                for (const subject of subjects) {
                    if (!combinedMap[prof].includes(subject)) {
                        combinedMap[prof].push(subject);
                    }
                }
            }
            totalPagesProcessed += pagesProcessed;
        }

        // Final combined save
        const result = Object.entries(combinedMap).map(([prof, subjects]) => ({
            [prof]: subjects
        }));
        const fs = await import('fs');
        fs.writeFileSync('./professors-subjects.json', JSON.stringify(result, null, 2));
        const endTime = Date.now();
        console.log(`[${new Date().toISOString()}] Scraping completed in ${(endTime - startTime) / 1000}s. Total professors: ${Object.keys(combinedMap).length}, pages: ${totalPagesProcessed}.`);

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error during scraping:`, error);
    } finally {
        for (const browser of browsers) {
            await browser.close();
        }
    }
}

async function main() {
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            console.log(`[${new Date().toISOString()}] Starting scraping attempt ${retries + 1}/${MAX_RETRIES}`);
            await scrapeProfessors();
            console.log(`[${new Date().toISOString()}] Scraping completed successfully.`);
            break; // Success, exit loop
        } catch (error) {
            retries++;
            console.error(`[${new Date().toISOString()}] Fatal error on attempt ${retries}/${MAX_RETRIES}:`, error);
            if (retries < MAX_RETRIES) {
                console.log(`[${new Date().toISOString()}] Retrying in 30 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds before retry
            } else {
                console.error(`[${new Date().toISOString()}] Max retries reached. Exiting.`);
            }
        }
    }
}

main();
