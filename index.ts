import puppeteer, { Page } from 'puppeteer';
import fs from 'fs';

console.log(process.env.Q_USERNAME, process.env.PASSWORD);

// Load courses from JSONL file
function loadCourses() {
    const coursesData = fs.readFileSync('./uff-courses.jsonl', 'utf8');
    const courses = coursesData
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    return courses;
}
const allClasses = [] as string[];
// Function to scrape a specific course
async function scrapeCourse(page: Page, courseId: number, courseName: string) {
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
    await Bun.sleep(3000);
    const classURLs = [] as string[];
    await page.evaluate(() => {
        const elements = document.querySelectorAll('.disciplina-nome a');
        return Array.from(elements).map(element => element.href);
    }).then(urls => {
        classURLs.push(...urls);
    });
    let hasNextPage = await page.$('.page-link[rel="next"]');
    while (hasNextPage) {
        await hasNextPage.click();
        await Bun.sleep(2000);
        await page.evaluate(() => {
            const elements = document.querySelectorAll('.disciplina-nome a');
            return Array.from(elements).map(element => element.href);
        }).then(urls => {
            classURLs.push(...urls);
        });
        hasNextPage = await page.$('.page-link[rel="next"]');
    }
    // Take a screenshot for this course
    allClasses.push(...classURLs);
    // Add your scraping logic here
    // Example: Get course schedule data, subjects, etc.

    return { courseId, courseName, url: fullUrl };
}

async function signIn(page: Page) {
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
    await Bun.sleep(2000);
}

async function simpleScrape() {
    // Launch browser
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1280,
            height: 800
        }
    });
    const page = await browser.newPage();

    // Go to initial website
    await page.goto('https://app.uff.br/graduacao/quadrodehorarios?conversationPropagation=none');

    // Wait for page to load completely
    await Bun.sleep(3000);

    // Sign in to the application
    await signIn(page);

    // Load all courses
    const courses = loadCourses();
    console.log(`📚 Loaded ${courses.length} courses to process`);

    // Results array to store data
    const results = [];

    // For loop to process each course
    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];

        try {
            console.log(`\n🔄 Processing ${i + 1}/${courses.length}`);
            const result = await scrapeCourse(page, course.id, course.name);
            results.push(result);

            // Wait between requests to be polite to the server
            await Bun.sleep(2000);

        } catch (error) {
            console.error(`❌ Error processing course ${course.id}: ${course.name}`, error);
        }
    }

    // Save results to JSON file
    fs.writeFileSync('./all-classes-urls.json', JSON.stringify(allClasses, null, 2));
    fs.writeFileSync('./scraping-results.json', JSON.stringify(results, null, 2));
    console.log(`\n✅ Completed! Processed ${results.length} courses`);
    console.log('📄 Results saved to scraping-results.json');

    // Close browser
    await browser.close();
}

simpleScrape();