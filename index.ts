#!/usr/bin/env bun
import puppeteer from 'puppeteer';
import fs from 'fs';
import { signIn } from './scripts/sign-in';
import { scrapeClasses } from './scripts/scrape-classes';

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        skipGetClasses: false,
        action: 'both', // 'get-classes', 'scrape-classes', or 'both'
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--skip-get-classes':
            case '-s':
                options.skipGetClasses = true;
                options.action = 'scrape-classes';
                break;
            case '--get-classes-only':
            case '-g':
                options.action = 'get-classes';
                break;
            case '--scrape-only':
            case '-r':
                options.action = 'scrape-classes';
                options.skipGetClasses = true;
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
            default:
                console.log(`Unknown option: ${arg}`);
                options.help = true;
                break;
        }
    }

    return options;
}

function showHelp() {
    console.log(`
🎓 UFF Course Scraper CLI

Usage: bun run index.ts [options]

Options:
  -s, --skip-get-classes    Skip the get-classes step and run scrape-classes only
  -g, --get-classes-only    Run only the get-classes step
  -r, --scrape-only         Run only the scrape-classes step (same as --skip-get-classes)
  -h, --help               Show this help message

Examples:
  bun run index.ts                    # Run both get-classes and scrape-classes
  bun run index.ts --skip-get-classes # Skip get-classes, run scrape-classes only
  bun run index.ts --scrape-only      # Same as above
  bun run index.ts --get-classes-only # Run get-classes only
`);
}

// Load courses from JSONL file
function loadCourses() {
    const coursesData = fs.readFileSync('./uff-courses.jsonl', 'utf8');
    const courses = coursesData
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    return courses;
}

// Define type for course result
interface CourseResult {
    courseId: number;
    courseName: string;
    url: string;
}

// Function to scrape a specific course (from get-classes.ts)
async function scrapeCourse(page: any, courseId: number, courseName: string, allClasses: string[]) {
    console.log(`\n🎓 Processing Course ID ${courseId}: ${courseName}`);

    const baseUrl = 'https://app.uff.br/graduacao/quadrodehorarios/';
    const params = new URLSearchParams({
        'utf8': '✓',
        'q[disciplina_nome_or_disciplina_codigo_cont]': '',
        'q[anosemestre_eq]': '20252',
        'q[disciplina_cod_departamento_eq]': '',
        'button': '',
        'q[idturno_eq]': '',
        'q[por_professor]': '',
        'q[idlocalidade_eq]': '',
        'q[vagas_turma_curso_idcurso_eq]': courseId.toString(),
        'q[disciplina_disciplinas_curriculos_idcurriculo_eq]': '',
        'q[curso_ferias_eq]': '',
        'q[idturmamodalidade_eq]': ''
    });
    const fullUrl = `${baseUrl}?${params.toString()}`;
    console.log(`📍 Navigating to: ${fullUrl}`);

    // Navigate to the course-specific URL
    await page.goto(fullUrl);
    await Bun.sleep(1500); // Reduced from 3000
    const classURLs = [] as string[];
    await page.evaluate(() => {
        const elements = document.querySelectorAll('.disciplina-nome a');
        // @ts-ignore
        return Array.from(elements).map(element => element.href);
    }).then((urls: string[]) => {
        classURLs.push(...urls);
    });

    let hasNextPage = await page.$('.page-link[rel="next"]');
    while (hasNextPage) {
        await hasNextPage.click();
        await Bun.sleep(1000); // Reduced from 2000
        await page.evaluate(() => {
            const elements = document.querySelectorAll('.disciplina-nome a');
            //@ts-ignore
            return Array.from(elements).map(element => element.href);
        }).then((urls: string[]) => {
            classURLs.push(...urls);
        });
        hasNextPage = await page.$('.page-link[rel="next"]');
    }

    allClasses.push(...classURLs);
    return { courseId, courseName, url: fullUrl };
}

async function runGetClasses(page: any) {
    console.log('🔍 Running get-classes step...');

    // Load all courses
    const courses = loadCourses();
    console.log(`📚 Loaded ${courses.length} courses to process`);

    // Results array to store data
    const results: CourseResult[] = [];
    const allClasses = [] as string[];

    // Concurrency limit to avoid overwhelming the server
    const concurrencyLimit = 5;
    const chunks = [];
    for (let i = 0; i < courses.length; i += concurrencyLimit) {
        chunks.push(courses.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
        const promises = chunk.map(async (course) => {
            try {
                const result = await scrapeCourse(page, course.id, course.name, allClasses);
                results.push(result);
                // Shorter delay between requests
                await Bun.sleep(1000);
            } catch (error) {
                console.error(`❌ Error processing course ${course.id}: ${course.name}`, error);
            }
        });
        await Promise.allSettled(promises);
    }

    // Write files once at the end
    fs.writeFileSync('./all-classes-urls.json', JSON.stringify(allClasses, null, 2));
    fs.writeFileSync('./scraping-results.json', JSON.stringify(results, null, 2));

    console.log(`\n✅ Get-classes completed! Processed ${results.length} courses`);
    console.log('📄 Results saved to scraping-results.json and all-classes-urls.json');

    return results;
}

async function runScrapeClasses(page: any) {
    console.log('🔍 Running scrape-classes step...');

    // Check if all-classes-urls.json exists
    if (!fs.existsSync('./all-classes-urls.json')) {
        console.error('❌ Error: all-classes-urls.json not found. Please run get-classes first or use without --skip-get-classes');
        process.exit(1);
    }

    // Load courses for context (optional, but useful for logging)
    const courses = loadCourses();

    // We'll use the first course as a placeholder since scrapeClasses doesn't really use these params
    const firstCourse = courses[0];
    await scrapeClasses(page, firstCourse.id, firstCourse.name);

    console.log('✅ Scrape-classes completed!');
}

async function main() {
    const options = parseArgs();

    if (options.help) {
        showHelp();
        return;
    }

    console.log('🚀 Starting UFF Course Scraper...');
    console.log(`📋 Action: ${options.action}`);

    // Launch browser
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 1280,
            height: 800
        }
    });
    const page = await browser.newPage();

    try {
        // Go to initial website
        await page.goto('https://app.uff.br/graduacao/quadrodehorarios?conversationPropagation=none');

        // Wait for page to load completely
        await Bun.sleep(3000);

        // Sign in to the application
        await signIn(page);

        // Execute based on selected action
        switch (options.action) {
            case 'get-classes':
                await runGetClasses(page);
                break;
            case 'scrape-classes':
                await runScrapeClasses(page);
                break;
            case 'both':
                await runGetClasses(page);
                await runScrapeClasses(page);
                break;
        }

    } catch (error) {
        console.error('❌ Error during execution:', error);
        process.exit(1);
    } finally {
        // Close browser
        await browser.close();
        console.log('🏁 Browser closed. Done!');
    }
}

// Run the main function
main().catch(console.error);
