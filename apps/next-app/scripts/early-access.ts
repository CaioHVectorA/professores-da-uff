import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import crypto from 'crypto';

/*
  Script: early-access.ts
  Objetivo:
    - Criar registros em ApplicationEarlyAccess a partir de uma lista de emails.
    - Gerar uma senha aleatória para cada email (substitui se já existir, a menos que --skip-existing).
    - Enviar email (via Resend) para cada usuário contendo a senha.
  Uso:
    bun tsx scripts/early-access.ts --test            -> processa apenas o email de teste (henrique_caio@id.uff.br)
    bun tsx scripts/early-access.ts --all             -> processa todos os emails
    bun tsx scripts/early-access.ts --all --dry-run   -> não envia emails nem grava no banco
    bun tsx scripts/early-access.ts --all --skip-existing -> não altera senha se já existir

  Pré-requisitos:
    - Variável de ambiente RESEND_API_KEY configurada.
    - (Opcional) FROM_EMAIL (default: "Early Access <no-reply@quadro.app>").

  Observação de segurança:
    Senhas em texto simples em email não é prática ideal em produção. Considere fluxo de criação de senha / magic link.
*/

const prisma = new PrismaClient();
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'Acme <onboarding@resend.dev>';
const TEST_EMAIL = 'henrique_caio@id.uff.br';

const rawEmails = `Henrique.caio@id.uff.br
arianw@id.uff.br
isabellamiranda@id.uff.br
befelix@id.uff.br
bfgomes@id.uff.br
jhonatan_a@id.uff.br
iuryf@id.uff.br
efraimt@id.uff.br
ana_romao@id.uff.br
milenarosario@id.uff.br
josuess@id.uff.br
m_s_santos@id.uff.br
test@id.uff.br
elissaguimaraes@id.uff.br
ana_a@id.uff.br
Marinhomatheus@id.uff.br
andreycouto@id.uff.br
juliaezequiel@id.uff.br
miranda_gabriel@id.uff.br
mpinel@id.uff.br
jpksantos@id.uff.br
Nathanjbp@id.uff.br
hellenbenites@id.uff.br
acobarbosa@id.uff.br
thainaj@id.uff.br
ravinemariana@id.uff.br
Janainasv@id.uff.br
kkaram@id.uff.br
estterf@id.uff.br
Thais_molina@id.uff.br
ricardo_maues@id.uff.br
sa_aba@id.uff.br
bvignoli@id.uff.br
pedroq@id.uff.br
isabelagrola@id.uff.br
lucioadalia@id.uff.br
yasmimcas@id.uff.br
laism@id.uff.br
Weslleyleal@id.uff.br
i_victoria@id.uff.br
leandro_araujo@id.uff.br
amanda_a@id.uff.br
giovannaroque@id.uff.br
kauanmedeiros@id.uff.br
${TEST_EMAIL}`;

function normalize(email: string) {
    return email.trim().toLowerCase();
}

function generatePassword(length = 8) {
    // Retorna uma senha NUMÉRICA de exatamente 'length' dígitos.
    // Usa crypto.randomInt para garantir distribuição uniforme.
    const max = 10 ** length; // limite exclusivo
    const n = crypto.randomInt(0, max); // 0 .. max-1
    return n.toString().padStart(length, '0');
}

interface Flags {
    all: boolean;
    test: boolean;
    dryRun: boolean;
    skipExisting: boolean;
}

function parseFlags(): Flags {
    const args = process.argv.slice(2);
    return {
        all: args.includes('--all'),
        test: args.includes('--test') || !args.includes('--all'), // default test
        dryRun: args.includes('--dry-run'),
        skipExisting: args.includes('--skip-existing'),
    };
}

async function ensureRecord(email: string, flags: Flags) {
    const existing = await prisma.applicationEarlyAccess.findUnique({ where: { email } });

    if (existing && flags.skipExisting) {
        return { email, password: existing.password, created: false, skipped: true };
    }

    const password = generatePassword();

    if (flags.dryRun) {
        return { email, password, created: !existing, skipped: false };
    }

    const record = await prisma.applicationEarlyAccess.upsert({
        where: { email },
        update: { password },
        create: { email, password },
    });

    return { email, password: record.password, created: !existing, skipped: false };
}

async function sendPasswordEmail(email: string, password: string, flags: Flags) {
    if (flags.dryRun) return { email, sent: false, reason: 'dry-run' };
    if (!resend) return { email, sent: false, reason: 'RESEND_API_KEY not set' };

    const subject = 'Seu acesso antecipado ao Quadro';
    const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.4">
      <h2>Bem-vindo ao Early Access do Quadro</h2>
      <p>Olá, seu acesso foi liberado.</p>
      <p><strong>Email:</strong> ${email}<br/>
         <strong>Senha:</strong> ${password}</p>
      <p>Use essas credenciais para entrar na plataforma. Recomendamos trocar/atualizar a senha assim que possível (quando a funcionalidade estiver disponível) ou utilizar o fluxo de magic link quando lançado.</p>
      <p>Se você não solicitou este acesso, ignore este email.</p>
      <hr/>
      <small>Mensagem automática - não responda.</small>
    </div>
  `;

    try {
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to: "caihebatista@gmail.com",
            subject,
            html,
        });
        console.log({ result })
        return { email, sent: true, id: (result as any)?.id };
    } catch (e: any) {
        console.error('Erro ao enviar email para', email, e?.message || e);
        return { email, sent: false, reason: e?.message || 'unknown error' };
    }
}

async function main() {
    const flags = parseFlags();

    let emails = Array.from(new Set(rawEmails.split(/\n|\r/).map(normalize).filter(Boolean)));

    if (flags.test) {
        emails = emails.filter(e => e === TEST_EMAIL);
        if (emails.length === 0) emails = [TEST_EMAIL];
    }

    console.log('Processando', emails.length, 'emails', flags);

    const summary: any[] = [];

    for (const email of emails) {
        const rec = await ensureRecord(email, flags);
        const sendRes = await sendPasswordEmail(email, rec.password, flags);
        // evitar duplicação da chave email
        summary.push({ ...rec, ...sendRes });
    }

    console.table(summary.map(s => ({ email: s.email, created: s.created, skipped: s.skipped, sent: s.sent, reason: s.reason || '' })));
    console.log('\nConcluído.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
