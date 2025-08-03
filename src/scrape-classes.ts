import fs from 'fs/promises';
import type { Page } from "puppeteer";
import { signIn } from "./sign-in";
const professors = new Map<string, string[]>();
// mapeia professores e as disciplinas que lecionam
async function scrapeClass(page: Page, actualClass: string) {
    await page.goto(actualClass);
    await Bun.sleep(2000);
    const content = await page.content();
    if (content.includes("Sessão expirada!")) {
        await signIn(page);
    }
    const table = await page.$('.tabela-alteracao-professores-turma');
    if (!table) return;
    // Select the first <td> of each <tr> inside <tbody> of the table
    // só há um professor por turma
    const profName = await table.$$eval('tbody tr td:first-child', tds =>
        tds.map(td => td.textContent?.trim() || '')
    );
    if (profName.length > 0) {
        const prof = profName[0]!;
        if (!professors.has(prof)) {
            professors.set(prof, []);
        }
        professors.get(prof)?.push(actualClass);
    }
    // Wait for the page to load completely
    await Bun.sleep(2000);
    console.log(`📚 Processed class: ${actualClass}`);
}
// Your scraping logic here

export async function scrapeClasses(page: Page, courseId: number, courseName: string) {
    const classes: string[] = await Bun.file('all-classes-urls.json').json()
    for (const actualClass of classes) {
        await scrapeClass(page, actualClass);
        await fs.writeFile('professors.json', JSON.stringify(Array.from(professors.entries()), null, 2));
        console.log(`📚 Processed class: ${actualClass}`);
    }
}    