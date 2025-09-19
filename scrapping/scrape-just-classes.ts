import puppeteer, { Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

let YEAR: string;
let INITIAL_PAGE: number;
let FINAL_PAGE: number;
let headless: boolean;
let DELAY_MULTIPLIER: number;
const MAX_RETRIES = 5; // Maximum retries per page
let BASE_URL: string;
const DATA_DIR = './data';
let OUTPUT_FILE: string;
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
let actualPage: number;

async function scrapePage(page: Page, pageNum: number, classesData: Record<string, string[]>, retryCount: number = 0): Promise<void> {
    if (retryCount >= MAX_RETRIES) {
        console.error(`Max retries reached for page ${pageNum}. Skipping.`);
        return;
    }

    try {
        actualPage = pageNum;
        const url = `${BASE_URL}${pageNum}`;
        console.log(`Navigating to page ${pageNum}: ${url} (retry ${retryCount})`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 * DELAY_MULTIPLIER });
        await new Promise(resolve => setTimeout(resolve, 2000 * DELAY_MULTIPLIER)); // 2 seconds navigation delay

        // Wait for the table to load
        await page.waitForSelector('#tabela-turmas tbody tr', { timeout: 10000 * DELAY_MULTIPLIER });

        // Get all rows
        const rows = await page.$$('#tabela-turmas tbody tr');

        for (const row of rows) {
            const tds = await row.$$('td');
            if (tds.length < 2) continue;

            const subjectLink = await tds[1]?.$('a');
            if (!subjectLink) continue;

            const subjectName = await subjectLink.evaluate((el: any) => el.textContent?.trim() || '');
            const subjectHref = await subjectLink.evaluate((el: any) => el.href);

            if (subjectName && subjectHref) {
                if (!classesData[subjectName]) {
                    classesData[subjectName] = [];
                }
                if (!classesData[subjectName].includes(subjectHref)) {
                    classesData[subjectName].push(subjectHref);
                }
            }
        }

        // Save data live
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(classesData, null, 2));
        console.log(`Page ${pageNum} scraped. Total subjects: ${Object.keys(classesData).length}, Total classes: ${Object.values(classesData).reduce((sum, arr) => sum + arr.length, 0)}`);

        // Save progress
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ year: YEAR, actualPage: pageNum }));

        // Proceed to next page
        if (pageNum < FINAL_PAGE) {
            await scrapePage(page, pageNum + 1, classesData);
        } else {
            const finalSubjectsCount = Object.keys(classesData).length;
            const finalClassesCount = Object.values(classesData).reduce((sum, arr) => sum + arr.length, 0);
            console.log(`Scraping completed. Final data: ${finalSubjectsCount} subjects, ${finalClassesCount} classes.`);
        }
    } catch (error) {
        console.error(`Error on page ${pageNum}:`, error);
        // Retry the same page
        await scrapePage(page, pageNum, classesData, retryCount + 1);
    }
}

async function scrapeClasses() {
    // Load parameters from params.json
    const params = JSON.parse(fs.readFileSync('./scrapping/params.json', 'utf-8'));
    YEAR = params.YEAR;
    INITIAL_PAGE = params.INITIAL_PAGE;
    FINAL_PAGE = params.FINAL_PAGE;
    headless = params.headless;
    DELAY_MULTIPLIER = params.DELAY_MULTIPLIER;
    BASE_URL = `https://app.uff.br/graduacao/quadrodehorarios/?button=&q%5Banosemestre_eq%5D=${YEAR}&q%5Bcurso_ferias_eq%5D=&q%5Bdisciplina_cod_departamento_eq%5D=&q%5Bdisciplina_nome_or_disciplina_codigo_cont%5D=&q%5Bidlocalidade_eq%5D=&q%5Bidturmamodalidade_eq%5D=&q%5Bidturno_eq%5D=&q%5Bvagas_turma_curso_idcurso_eq%5D=&page=`;
    OUTPUT_FILE = path.join(DATA_DIR, `classes_${YEAR}.json`);
    actualPage = INITIAL_PAGE;

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Initialize data structure
    let classesData: Record<string, string[]> = {};

    // Load existing data if file exists
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            classesData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
        } catch (e) {
            console.log('Error loading existing data, starting fresh.');
        }
    }

    // Calculate initial counts for comparison
    const initialSubjectsCount = Object.keys(classesData).length;
    const initialClassesCount = Object.values(classesData).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`Initial data: ${initialSubjectsCount} subjects, ${initialClassesCount} classes.`);

    // Load progress
    if (fs.existsSync(PROGRESS_FILE)) {
        try {
            const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
            if (progress.year === YEAR) {
                actualPage = progress.actualPage || INITIAL_PAGE;
                console.log(`Resuming from page ${actualPage} for year ${YEAR}`);
            } else {
                console.log(`Progress file is for a different year (${progress.year}), starting from initial page.`);
            }
        } catch (e) {
            console.log('Error loading progress, starting from initial page.');
        }
    }

    const browser = await puppeteer.launch({ headless });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await Bun.sleep(2000 * DELAY_MULTIPLIER); // Initial delay to ensure browser is ready

    try {
        await scrapePage(page, actualPage, classesData);
    } catch (error) {
        console.error('Fatal error during scraping:', error);
    } finally {
        await browser.close();
    }
}

scrapeClasses();
