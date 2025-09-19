import puppeteer, { Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { signIn } from '../scripts/sign-in';

let YEAR: string;
let headless: boolean;
let MAX_RETRIES: number;
let SESSION_CHECK_INTERVAL: number;
let DELAY_BETWEEN_CLASSES: number;
let RETRY_DELAYS: number[];
let DELAY_MULTIPLIER: number;
const DATA_DIR = './data';
let CLASSES_FILE: string;
const PROFESSORS_DATA_FILE = path.join(DATA_DIR, 'professors-data.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress-prof.json');
const NOT_SAVED_FILE = path.join(DATA_DIR, 'not-saved-professors.json');
const NO_PROFESSORS_FILE = path.join(DATA_DIR, 'no-professors.json');

let lastSessionCheck = Date.now();

interface ProfessorEntry {
    subject: string;
    Y: string;
}

async function loadParams() {
    const params = JSON.parse(fs.readFileSync('./scrapping/params-prof.json', 'utf-8'));
    YEAR = params.YEAR;
    headless = params.headless;
    MAX_RETRIES = params.MAX_RETRIES;
    DELAY_MULTIPLIER = params.DELAY_MULTIPLIER;
    SESSION_CHECK_INTERVAL = params.SESSION_CHECK_INTERVAL * 60 * 1000 * DELAY_MULTIPLIER;
    DELAY_BETWEEN_CLASSES = params.DELAY_BETWEEN_CLASSES * DELAY_MULTIPLIER;
    RETRY_DELAYS = params.RETRY_DELAYS.map((d: number) => d * DELAY_MULTIPLIER);
    CLASSES_FILE = path.join(DATA_DIR, `classes_${YEAR}.json`);
}

async function loadClasses(): Promise<Record<string, string[]>> {
    if (!fs.existsSync(CLASSES_FILE)) {
        throw new Error(`Classes file not found: ${CLASSES_FILE}`);
    }
    return JSON.parse(fs.readFileSync(CLASSES_FILE, 'utf-8'));
}

async function loadProfessorsData(): Promise<Record<string, ProfessorEntry[]>> {
    if (fs.existsSync(PROFESSORS_DATA_FILE)) {
        return JSON.parse(fs.readFileSync(PROFESSORS_DATA_FILE, 'utf-8'));
    }
    return {};
}

async function loadProgress(): Promise<{ processedClasses: string[] }> {
    if (fs.existsSync(PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
    return { processedClasses: [] };
}

async function loadNotSaved(): Promise<string[]> {
    if (fs.existsSync(NOT_SAVED_FILE)) {
        return JSON.parse(fs.readFileSync(NOT_SAVED_FILE, 'utf-8'));
    }
    return [];
}

async function loadNoProfessors(): Promise<string[]> {
    if (fs.existsSync(NO_PROFESSORS_FILE)) {
        return JSON.parse(fs.readFileSync(NO_PROFESSORS_FILE, 'utf-8'));
    }
    return [];
}

async function saveProfessorsData(data: Record<string, ProfessorEntry[]>) {
    fs.writeFileSync(PROFESSORS_DATA_FILE, JSON.stringify(data, null, 2));
}

async function saveProgress(processedClasses: string[]) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ processedClasses, year: YEAR }, null, 2));
}

async function saveNotSaved(notSaved: string[]) {
    fs.writeFileSync(NOT_SAVED_FILE, JSON.stringify(notSaved, null, 2));
}

function saveNoProfessors(noProfessors: string[]) {
    fs.writeFileSync(NO_PROFESSORS_FILE, JSON.stringify(noProfessors, null, 2));
}

async function checkAndRenewSession(page: Page) {
    const now = Date.now();
    if (now - lastSessionCheck > SESSION_CHECK_INTERVAL) {
        console.log('Checking session...');
        try {
            await page.waitForSelector('#tabela-alteracao-professores-turma', { timeout: 2000 * DELAY_MULTIPLIER });
        } catch {
            console.log('Session expired, re-logging in...');
            await page.goto('https://app.uff.br/graduacao/quadrodehorarios/sessions/new', { waitUntil: 'networkidle2', timeout: 30000 * DELAY_MULTIPLIER });
            await signIn(page);
        }
        lastSessionCheck = now;
    }
}

async function processClass(page: Page, classUrl: string, subjectName: string, professorsData: Record<string, ProfessorEntry[]>, retryCount = 0): Promise<boolean> {
    try {
        await checkAndRenewSession(page);
        await page.goto(classUrl, { waitUntil: 'networkidle2', timeout: 30000 * DELAY_MULTIPLIER });
        await new Promise(resolve => setTimeout(resolve, 1000 * DELAY_MULTIPLIER));

        // Check for no professor allocated before trying selector
        const content = await page.content();
        if (content.includes('Nenhum docente alocado para esta turma') || content.includes('Sem professor alocado')) {
            console.log(`No professor allocated for class ${classUrl}.`);
            // Save to no-professors
            const currentNoProf = await loadNoProfessors();
            if (!currentNoProf.includes(classUrl)) {
                currentNoProf.push(classUrl);
                saveNoProfessors(currentNoProf);
            }
            return false;
        }

        await page.waitForSelector('#tabela-alteracao-professores-turma tbody tr td:first-child', { timeout: 5000 * DELAY_MULTIPLIER });
        const professor = await page.$('#tabela-alteracao-professores-turma tbody tr td:first-child');
        const professorName = professor ? await professor.evaluate((el: any) => el.textContent?.trim() || '') : '';

        if (professorName && professorName !== 'Sem professor alocado') {
            if (!professorsData[professorName]) {
                professorsData[professorName] = [];
            }
            const entry: ProfessorEntry = { subject: subjectName, Y: YEAR };
            if (!professorsData[professorName].some(e => e.subject === entry.subject && e.Y === entry.Y)) {
                professorsData[professorName].push(entry);
            }
            return true;
        } else {
            throw new Error('No valid professor found');
        }
    } catch (error) {
        console.error(`Error processing class ${classUrl} (retry ${retryCount}):`, error);

        // Double-check for no professor in case of error
        try {
            const content = await page.content();
            if (content.includes('Nenhum docente alocado para esta turma') || content.includes('Sem professor alocado')) {
                console.log(`No professor allocated for class ${classUrl} (detected on error).`);
                const currentNoProf = await loadNoProfessors();
                if (!currentNoProf.includes(classUrl)) {
                    currentNoProf.push(classUrl);
                    saveNoProfessors(currentNoProf);
                }
                return false;
            }
        } catch (e) {
            // Ignore if can't get content
        }

        if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCount] || 10000;
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            // Re-login before retry
            console.log('Re-logging in before retry...');
            await page.goto('https://app.uff.br/graduacao/quadrodehorarios/sessions/new', { waitUntil: 'networkidle2', timeout: 30000 * DELAY_MULTIPLIER });
            await signIn(page);
            return await processClass(page, classUrl, subjectName, professorsData, retryCount + 1);
        }
        return false;
    }
}

async function scrapeProfessors() {
    await loadParams();

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const classesData = await loadClasses();
    const professorsData = await loadProfessorsData();
    const progress = await loadProgress();
    const notSaved = await loadNotSaved();
    const noProfessors = await loadNoProfessors();

    const processedClasses = new Set(progress.processedClasses);
    // Include no-professors classes as processed
    noProfessors.forEach(url => processedClasses.add(url));

    const browser = await puppeteer.launch({ headless });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    // await page.goto('https://app.uff.br/graduacao/quadrodehorarios/', { waitUntil: 'networkidle2' });
    await page.goto('https://app.uff.br/graduacao/quadrodehorarios/sessions/new', { waitUntil: 'networkidle2', timeout: 30000 * DELAY_MULTIPLIER });
    // Initial login
    await signIn(page);

    try {
        for (const [subjectName, classUrls] of Object.entries(classesData)) {
            for (const classUrl of classUrls) {
                if (processedClasses.has(classUrl)) {
                    console.log(`Skipping alady processed: ${classUrl}`);
                    continue;
                }

                const success = await processClass(page, classUrl, subjectName, professorsData);
                if (success) {
                    processedClasses.add(classUrl);
                    console.log(`Successfully processed class: ${classUrl}`);
                } else {
                    console.log(`Failed to process class (will retry later): ${classUrl}`);
                }

                // Save progress after each class
                await saveProgress(Array.from(processedClasses));
                await saveProfessorsData(professorsData);
                await saveNotSaved(notSaved);

                // Respect delay between classes
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CLASSES));
            }
        }

        // Final save of professors data
        await saveProfessorsData(professorsData);
        // Save progress
        await saveProgress(Array.from(processedClasses));
    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        await browser.close();
    }
}

scrapeProfessors();
