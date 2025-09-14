import puppeteer, { Page } from 'puppeteer';
import { signIn } from '../scripts/sign-in';

async function scrapePage(page: Page, url: string, allProfessorsMap: Record<string, string[]>): Promise<number> {
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Check if logged in by waiting for table
    try {
        await page.waitForSelector('#tabela-turmas tbody tr', { timeout: 5000 });
    } catch {
        // If not, re-login
        console.log(`[${new Date().toISOString()}] Session expired, re-logging in...`);
        await page.goto('https://app.uff.br/', { waitUntil: 'networkidle2' });
        await signIn(page);
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('#tabela-turmas tbody tr', { timeout: 10000 });
    }

    const rows = await page.$$('#tabela-turmas tbody tr');
    let newProfessorsCount = 0;
    console.log(`[${new Date().toISOString()}] Scraping ${rows.length} rows from ${url}`);
    for (const row of rows) {
        const tds = await row.$$('td');
        if (tds.length < 2) continue;

        // Get subject name
        const subjectLink = await tds[1]?.$('a');
        if (!subjectLink) continue;
        const subject = await subjectLink.evaluate((el: any) => el.textContent?.trim() || '');

        // Get title attribute
        const title = await tds[1]?.evaluate((el: any) => el.getAttribute('title') || '');

        // Parse professors
        const professorMatch = title?.match(/Professor\(es\):\s*(.*?)<br/);
        if (professorMatch && professorMatch[1]) {
            const professorsText = professorMatch[1].trim();
            const professors = professorsText.split(',').map((p: string) => p.trim()).filter((p: string) => p);

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
    }

    return newProfessorsCount;
}

async function getLastPage(page: Page): Promise<number> {
    const baseUrl = 'https://app.uff.br/graduacao/quadrodehorarios/?button=&q%5Banosemestre_eq%5D=20252&q%5Bcurso_ferias_eq%5D=&q%5Bdisciplina_cod_departamento_eq%5D=&q%5Bdisciplina_nome_or_disciplina_codigo_cont%5D=&q%5Bidlocalidade_eq%5D=&q%5Bidturmamodalidade_eq%5D=&q%5Bidturno_eq%5D=&q%5Bvagas_turma_curso_idcurso_eq%5D=&page=1';
    console.log(`[${new Date().toISOString()}] Fetching last page number...`);
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
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
    console.log(`[${new Date().toISOString()}] Starting scraping process...`);

    const browser1 = await puppeteer.launch({ headless: true, protocolTimeout: 60000 });
    const page1 = await browser1.newPage();

    const browser2 = await puppeteer.launch({ headless: true, protocolTimeout: 60000 });
    const page2 = await browser2.newPage();

    try {
        // Login on browser 1
        console.log(`[${new Date().toISOString()}] Logging in on browser 1...`);
        await page1.goto('https://app.uff.br/', { waitUntil: 'networkidle2' });
        await signIn(page1);
        await page1.goto('https://app.uff.br/graduacao/quadrodehorarios/', { waitUntil: 'networkidle2' });

        // Login on browser 2
        console.log(`[${new Date().toISOString()}] Logging in on browser 2...`);
        await page2.goto('https://app.uff.br/', { waitUntil: 'networkidle2' });
        await signIn(page2);
        await page2.goto('https://app.uff.br/graduacao/quadrodehorarios/', { waitUntil: 'networkidle2' });

        // Get last page using page1
        const lastPage = await getLastPage(page1);
        console.log(`[${new Date().toISOString()}] Total pages: ${lastPage}`);

        const baseUrl = 'https://app.uff.br/graduacao/quadrodehorarios/?button=&q%5Banosemestre_eq%5D=20252&q%5Bcurso_ferias_eq%5D=&q%5Bdisciplina_cod_departamento_eq%5D=&q%5Bdisciplina_nome_or_disciplina_codigo_cont%5D=&q%5Bidlocalidade_eq%5D=&q%5Bidturmamodalidade_eq%5D=&q%5Bidturno_eq%5D=&q%5Bvagas_turma_curso_idcurso_eq%5D=';

        const allProfessorsMap: Record<string, string[]> = {};
        let totalNewProfessors = 0;
        let pagesProcessed = 0;

        let left = 1;
        let right = lastPage;

        while (left <= right) {
            const promises = [];
            let batchNew = 0;

            if (left <= right) {
                const url1 = `${baseUrl}&page=${left}`;
                promises.push(scrapePage(page1, url1, allProfessorsMap).then(newCount => {
                    console.log(`[${new Date().toISOString()}] Scraped page ${left}, new professors: ${newCount}`);
                    batchNew += newCount;
                    pagesProcessed++;
                }));
                left++;
            }

            if (left <= right) {
                const url2 = `${baseUrl}&page=${right}`;
                promises.push(scrapePage(page2, url2, allProfessorsMap).then(newCount => {
                    console.log(`[${new Date().toISOString()}] Scraped page ${right}, new professors: ${newCount}`);
                    batchNew += newCount;
                    pagesProcessed++;
                }));
                right--;
            }

            await Promise.all(promises);
            totalNewProfessors += batchNew;

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
        await browser1.close();
        await browser2.close();
    }
}

scrapeProfessors();
