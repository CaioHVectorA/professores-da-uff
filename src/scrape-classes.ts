import fs from 'fs/promises';
import type { Page } from "puppeteer";
import { signIn } from "./sign-in";

// Estrutura para armazenar dados dos professores com classes processadas
interface ProfessorData {
    subjects: string[];
    processedClasses: string[];
}

const professors = new Map<string, ProfessorData>();
const processedClasses = new Set<string>();

// Função para carregar dados existentes de professores e classes processadas
async function loadExistingData() {
    try {
        const data = await fs.readFile('professors.json', 'utf8');
        const existingData = JSON.parse(data);

        // Se o formato antigo (array), converte para o novo formato
        if (Array.isArray(existingData)) {
            for (const [profName, subjects] of existingData) {
                professors.set(profName, {
                    subjects: Array.isArray(subjects) ? subjects : [],
                    processedClasses: []
                });
            }
        } else if (existingData && typeof existingData === 'object') {
            // Novo formato com processedClasses
            for (const [profName, data] of Object.entries(existingData)) {
                const profData = data as any;
                professors.set(profName, {
                    subjects: profData.subjects || [],
                    processedClasses: profData.processedClasses || []
                });

                // Adiciona classes processadas ao Set para verificação rápida
                if (profData.processedClasses) {
                    profData.processedClasses.forEach((classUrl: string) => {
                        processedClasses.add(classUrl);
                    });
                }
            }
        }

        console.log(`📊 Loaded data for ${professors.size} professors`);
        console.log(`🔍 Found ${processedClasses.size} previously processed classes`);
    } catch (error) {
        console.log('📝 No existing professors.json found, starting fresh');
    }
}

// mapeia professores e as disciplinas que lecionam
async function scrapeClass(page: Page, actualClass: string, retryCount = 0) {
    // Verifica se a classe já foi processada anteriormente
    if (processedClasses.has(actualClass)) {
        console.log(`⏭️  Skipping already processed class: ${actualClass}`);
        return;
    }

    try {
        await page.goto(actualClass);
        await Bun.sleep(2000);
        const content = await page.content();
        if (content.includes("Sessão expirada!")) {
            await signIn(page);
        }
        const table = await page.$('#tabela-alteracao-professores-turma');
        if (!table) {
            console.log(`❌ Table not found for class: ${actualClass}`);
            // Marca como processada mesmo sem tabela para evitar tentar novamente
            if (retryCount < 3) {
                await signIn(page);
                console.log(`🔄 Retrying to scrape class: ${actualClass} (Attempt ${retryCount + 1})`)
                return await scrapeClass(page, actualClass, retryCount + 1);
            }
            return;
        }

        // Select the first <td> of each <tr> inside <tbody> of the table
        // só há um professor por turma
        const profName = await table.$$eval('tbody tr td:first-child', tds =>
            tds.map(td => td.textContent?.trim() || '')
        );
        const subjectTitle = (await page.$('h1 span'))
        const subjectName = (await subjectTitle?.evaluate(el => el.textContent?.trim() || ''))?.split(' - ')[1];

        if (profName.length > 0) {
            const prof = profName[0]!;
            if (!professors.has(prof)) {
                professors.set(prof, {
                    subjects: [],
                    processedClasses: []
                });
            }

            const profData = professors.get(prof)!;

            // Adiciona a disciplina se ainda não estiver na lista
            if (subjectName && !profData.subjects.includes(subjectName)) {
                profData.subjects.push(subjectName);
            }

            // Adiciona a classe processada
            if (!profData.processedClasses.includes(actualClass)) {
                profData.processedClasses.push(actualClass);
            }
        }

        // Marca a classe como processada
        processedClasses.add(actualClass);

        // Wait for the page to load completely
        await Bun.sleep(2000);
        console.log(`📚 Processed class: ${actualClass} - Subject: ${subjectName || 'Unknown'}`);
    } catch (error) {
        console.error(`❌ Error processing class ${actualClass}:`, error);
        // Marca como processada mesmo com erro para evitar loop infinito
        processedClasses.add(actualClass);
    }
}
// Your scraping logic here

export async function scrapeClasses(page: Page, courseId: number, courseName: string) {
    // Carrega dados existentes antes de começar
    await loadExistingData();

    const classes: string[] = await Bun.file('all-classes-urls.json').json();

    console.log(`📊 Total classes to process: ${classes.length}`);
    console.log(`⏭️  Classes already processed: ${processedClasses.size}`);
    console.log(`🔄 Classes remaining: ${classes.length - processedClasses.size}`);

    let processedCount = 0;
    let skippedCount = 0;

    for (const actualClass of classes) {
        if (processedClasses.has(actualClass)) {
            skippedCount++;
            console.log(`⏭️  Skipping (${skippedCount}/${processedClasses.size}): ${actualClass}`);
            continue;
        }

        processedCount++;
        console.log(`🔍 Processing (${processedCount}/${classes.length - processedClasses.size}): ${actualClass}`);
        await scrapeClass(page, actualClass);

        // Salva o progresso a cada classe processada
        await saveProfessorsData();

        // Pequena pausa entre requests
        await Bun.sleep(1000);
    }

    console.log(`\n✅ Scraping completed!`);
    console.log(`📊 Statistics:`);
    console.log(`   - Total classes: ${classes.length}`);
    console.log(`   - Newly processed: ${processedCount}`);
    console.log(`   - Skipped (already processed): ${skippedCount}`);
    console.log(`   - Total professors found: ${professors.size}`);
}

// Função para salvar dados dos professores no novo formato
async function saveProfessorsData() {
    const data: Record<string, ProfessorData> = {};

    for (const [profName, profData] of professors.entries()) {
        data[profName] = {
            subjects: profData.subjects,
            processedClasses: profData.processedClasses
        };
    }

    await fs.writeFile('professors.json', JSON.stringify(data, null, 2));
}    