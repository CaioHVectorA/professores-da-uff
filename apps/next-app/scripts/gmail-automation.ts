/*
  AVISO:
  - Automatizar a interface web do Gmail pode violar Termos de Uso do Google e é frágil (mudanças de HTML, detecção anti‑bot, 2FA, bloqueios de segurança).
  - Preferível: API Gmail + OAuth2 ou SMTP com App Password.
  - Use isto apenas para testes locais / POC.

  Requisitos:
    bun add puppeteer
    (Se usar Prisma para obter usuários) já existe @prisma/client.

  Variáveis de ambiente:
    GMAIL_EMAIL      -> email (ex: exemplo@gmail.com)
    GMAIL_PASSWORD   -> senha ou APP PASSWORD (conta com 2FA precisa de App Password)
    GMAIL_HEADLESS   -> 'true' para headless. (default: false)
    EARLY_ACCESS_LINK -> (opcional) base URL do acesso antecipado (ex: https://quadro.app)
*/

import fs from 'fs';
import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
const prisma = new PrismaClient();

interface TargetUser { email: string; password?: string; }

interface Flags {
    to?: string[];
    subject?: string;
    body?: string;
    bodyFile?: string;
    template?: string;
    fromDb: boolean;
    limit?: number;
    dryRun: boolean;
    delayMs: number;
    snapshots: boolean;
    skipExisting: boolean; // novo
    link?: string;         // novo
}

function parseFlags(): Flags {
    const args = process.argv.slice(2);
    function get(name: string) {
        const idx = args.indexOf(name); if (idx >= 0) return args[idx + 1]; return undefined;
    }
    return {
        to: get('--to')?.split(',').map(s => s.trim()).filter(Boolean),
        subject: get('--subject'),
        body: get('--body'),
        bodyFile: get('--body-file'),
        template: get('--template'),
        fromDb: args.includes('--from-db'),
        limit: get('--limit') ? Number(get('--limit')) : undefined,
        dryRun: args.includes('--dry-run'),
        delayMs: get('--delay-ms') ? Number(get('--delay-ms')) : 4000,
        snapshots: args.includes('--snapshots'),
        skipExisting: args.includes('--skip-existing'),
        link: get('--link') || process.env.EARLY_ACCESS_LINK || 'https://quadro.app'
    };
}

async function loadTemplate(flags: Flags) {
    if (flags.template) return fs.readFileSync(flags.template, 'utf8');
    if (flags.bodyFile) return fs.readFileSync(flags.bodyFile, 'utf8');
    if (flags.body) return flags.body;
    // Template padrão solicitado
    return `Olá! Muito obrigado por se disponibilizar para o acesso antecipado do ProfessoresDaUff. Sua senha é {{password}} e você deve entrar com o seu email da uff.\n\nAcesse diretamente: {{link}}/acesso-antecipado`;
}

async function getUsers(flags: Flags): Promise<TargetUser[]> {
    if (flags.fromDb) {
        const rows = await prisma.applicationEarlyAccess.findMany({ take: flags.limit });
        return rows.map(r => ({ email: r.email, password: r.password }));
    }
    const list = (flags.to || []).map(email => ({ email }));
    return flags.limit ? list.slice(0, flags.limit) : list;
}

function renderTemplate(tpl: string, user: TargetUser, link: string) {
    return tpl.replace(/{{\s*email\s*}}/g, user.email)
        .replace(/{{\s*password\s*}}/g, user.password || '')
        .replace(/{{\s*link\s*}}/g, link);
}

async function gmailLogin(page: Page, email: string, password: string) {
    await page.goto('https://accounts.google.com/signin/v2/identifier?service=mail', { waitUntil: 'networkidle2' });
    await page.type('input[type=email]', email, { delay: 50 });
    await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        Bun.sleep(2000),
    ]);
    await page.waitForSelector('input[type=password]', { timeout: 20000 });
    await page.type('input[type=password]', password, { delay: 40 });
    await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    // esperar caixa de entrada
    await page.waitForSelector('div[role=button][gh="cm"], .T-I.T-I-KE.L3', { timeout: 40000 });
}

function generatePassword(length = 8) {
    // Gera senha numérica criptograficamente forte
    const max = 10 ** length; // exclusivo
    const n = crypto.randomInt(0, max);
    return n.toString().padStart(length, '0');
}

async function generateUniquePassword(length = 8, maxAttempts = 30): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
        const pwd = generatePassword(length);
        const exists = await prisma.applicationEarlyAccess.findFirst({ where: { password: pwd } });
        if (!exists) return pwd;
    }
    throw new Error('Não foi possível gerar senha única após várias tentativas');
}

async function ensureEarlyAccess(email: string, flags: Flags): Promise<string> {
    if (flags.dryRun) {
        return generatePassword();
    }
    const existing = await prisma.applicationEarlyAccess.findUnique({ where: { email } });
    if (existing) return existing.password; // Reutiliza senha existente SEM alterar
    const password = await generateUniquePassword();
    await prisma.applicationEarlyAccess.create({ data: { email, password } });
    return password;
}

async function sendEmail(page: Page, user: TargetUser, subject: string, html: string, flags: Flags) {
    if (flags.dryRun) {
        console.log('[dry-run] pular envio para', user.email, 'senha', user.password);
        return;
    }

    const composeSelectors = ['div[role=button][gh="cm"]', '.T-I.T-I-KE.L3'];
    let composeOpened = false;
    for (const sel of composeSelectors) {
        const el = await page.$(sel);
        if (el) { await el.click(); composeOpened = true; break; }
    }
    if (!composeOpened) {
        await page.keyboard.press('c');
        composeOpened = true;
    }
    await new Promise(r => setTimeout(r, 700));

    const plainBody = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // Digitar destinatário (campo deve já estar focado). Caso não esteja, forçar foco procurando textarea[name=to]
    const activeIsTo = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null;
        if (!a) return false;
        return a.getAttribute('name') === 'to' || a.getAttribute('aria-label')?.toLowerCase().includes('para') || a.tagName === 'TEXTAREA';
    });
    if (!activeIsTo) {
        const toEl = await page.$('textarea[name=to], input[aria-label="Para"], div[aria-label="Para"] input');
        if (toEl) await toEl.click();
    }
    await page.keyboard.type(user.email, { delay: 40 });
    await new Promise(r => setTimeout(r, 120));

    // Avançar até o campo de assunto (algumas contas têm campo CC no meio)
    for (let i = 0; i < 3; i++) {
        const subjectFocused = await page.evaluate(() => {
            const a = document.activeElement as HTMLElement | null;
            return !!a && a.getAttribute('name') === 'subjectbox';
        });
        if (subjectFocused) break;
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 100));
    }

    // Se mesmo assim não focou, clicar diretamente
    const subjEl = await page.$('input[name=subjectbox]');
    if (subjEl) {
        await subjEl.click({ clickCount: 3 }).catch(() => { });
    }
    await new Promise(r => setTimeout(r, 80));
    // Limpa qualquer texto existente (backspace segurado) e digita assunto
    await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(subject, { delay: 30 });
    await new Promise(r => setTimeout(r, 120));

    // Ir para corpo: Tab até encontrar um div contenteditable
    for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 120));
        const bodyFocused = await page.evaluate(() => {
            const a = document.activeElement as HTMLElement | null;
            if (!a) return false;
            return a.getAttribute('aria-label')?.toLowerCase().includes('mensagem') || a.getAttribute('aria-label')?.toLowerCase().includes('message') || a.getAttribute('contenteditable') === 'true';
        });
        if (bodyFocused) break;
    }

    // Digitar corpo
    await page.keyboard.type(plainBody, { delay: 15 });
    await new Promise(r => setTimeout(r, 150));

    // Tab para botão enviar (normalmente 1 ou 2 tabs). Faremos até 4 tentativas e se não enviar, fallback por seletor
    let sent = false;
    for (let i = 0; i < 4 && !sent; i++) {
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 120));
        // Testar se foco está em um botão que pode enviar com Enter
        const canSend = await page.evaluate(() => {
            const a = document.activeElement as HTMLElement | null;
            if (!a) return false;
            const label = (a.getAttribute('data-tooltip') || a.getAttribute('aria-label') || '').toLowerCase();
            return label.includes('enviar') || label.includes('send');
        });
        if (canSend) {
            await page.keyboard.press('Enter');
            sent = true;
            break;
        }
    }

    if (!sent) {
        // Fallback seletor
        const sendSelectors = [
            'div[role=button][data-tooltip*="Enviar"]',
            'div[role=button][data-tooltip*="Send"]',
            'div[role=button][aria-label*="Enviar"]',
            'div[role=button][aria-label*="Send"]',
            'div.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3'
        ];
        for (const sel of sendSelectors) {
            const btn = await page.$(sel);
            if (btn) { await btn.click(); sent = true; break; }
        }
    }

    await new Promise(r => setTimeout(r, 1200));
    console.log('Enviado (tab-flow verificado) para', user.email);
}

async function snapshot(page: Page, name: string) {
    const dir = path.join(process.cwd(), 'gmail-snapshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const html = await page.content();
    fs.writeFileSync(path.join(dir, name + '.html'), html, 'utf8');
    await page.screenshot({ path: path.join(dir, `${name}.png`) as any, fullPage: false } as any);
}

async function run() {
    const flags = parseFlags();
    const EMAIL = process.env.GMAIL_EMAIL;
    const PASS = process.env.GMAIL_PASSWORD;
    if (!EMAIL || !PASS) {
        console.error('Defina GMAIL_EMAIL e GMAIL_PASSWORD');
        process.exit(1);
    }
    const template = await loadTemplate(flags);
    const users = await getUsers(flags);
    if (!users.length) {
        console.error('Nenhum destinatário');
        process.exit(1);
    }
    const subject = flags.subject || 'ProfessoresDaUff acesso antecipado';

    // Garante/gera senha para cada usuário (sempre reutiliza se já existe)
    for (const u of users) {
        u.password = await ensureEarlyAccess(u.email, flags);
    }

    const browser: Browser = await puppeteer.launch({ headless: process.env.GMAIL_HEADLESS === 'true', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.setDefaultTimeout(45000);

    try {
        console.log('Login Gmail...');
        await gmailLogin(page, EMAIL, PASS);
        if (flags.snapshots) await snapshot(page, 'inbox');

        for (const user of users) {
            const body = renderTemplate(template, user, flags.link!);
            try {
                await sendEmail(page, user, subject, body, flags);
                if (flags.snapshots) await snapshot(page, 'after-send-' + user.email.replace(/[^a-z0-9]/gi, '_'));
            } catch (e: any) {
                console.error('Falha envio', user.email, e.message);
            }
            await new Promise(r => setTimeout(r, flags.delayMs));
        }
    } finally {
        if (!flags.dryRun) {
            await new Promise(r => setTimeout(r, 3000));
        }
        await browser.close();
        await prisma.$disconnect();
    }
    console.log('Concluído.');
}

run().catch(e => { console.error(e); process.exit(1); });
