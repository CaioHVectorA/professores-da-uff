import puppeteer, { Page } from 'puppeteer';
import { signIn } from '../scripts/sign-in';

const BROWSERS_NUM = 1;

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
        await page.waitForSelector('#tabela-alteracao-professores-turma tbody tr td:first-child', { timeout: 10000 });
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

async function scrapeProfessors() {
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] Starting scraping process with ${BROWSERS_NUM} browsers...`);

    const browsers: any[] = [];
    const pages: any[] = [];

    for (let i = 0; i < BROWSERS_NUM; i++) {
        const browser = await puppeteer.launch({
            headless: false, protocolTimeout: 60000, defaultViewport: {
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

        const allProfessorsMap: Record<string, string[]> = {};
        let totalNewProfessors = 0;
        let pagesProcessed = 0;

        for (let pageNum = 1; pageNum <= lastPage; pageNum++) {
            const url = `${baseUrl}&page=${pageNum}`;
            const newCount = await scrapePage(pages[0], url, allProfessorsMap);
            console.log(`[${new Date().toISOString()}] Scraped page ${pageNum}, new professors: ${newCount}`);
            totalNewProfessors += newCount;
            pagesProcessed++;

            // Save every 20 new professors
            if (totalNewProfessors >= 20) {
                const result = Object.entries(allProfessorsMap).map(([prof, subjects]) => ({
                    [prof]: subjects
                }));
                const fs = await import('fs');
                fs.writeFileSync('./professors-subjects.json', JSON.stringify(result, null, 2));
                console.log(`[${new Date().toISOString()}] Saved progress: ${Object.keys(allProfessorsMap).length} professors, ${pagesProcessed} pages processed.`);
                totalNewProfessors = 0; // Reset counter
            }

            // Small delay
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Final save
        const result = Object.entries(allProfessorsMap).map(([prof, subjects]) => ({
            [prof]: subjects
        }));
        const fs = await import('fs');
        fs.writeFileSync('./professors-subjects.json', JSON.stringify(result, null, 2));
        const endTime = Date.now();
        console.log(`[${new Date().toISOString()}] Scraping completed in ${(endTime - startTime) / 1000}s. Total professors: ${Object.keys(allProfessorsMap).length}, pages: ${pagesProcessed}.`);

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error during scraping:`, error);
    } finally {
        for (const browser of browsers) {
            await browser.close();
        }
    }
}

scrapeProfessors();
