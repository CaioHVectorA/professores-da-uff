# Copilot Rules – Next-App com Bun, Tailwind CSS, ShadCN UI e Prisma

## Estrutura do Projeto

- A estrutura principal está em `/apps`.
- O app a ser trabalhado agora é o `next-app`.
- O frontend e o server existentes servem como referência para portar funcionalidades e lógica para o ecossistema Next.js com Prisma.
- O foco é manter o máximo possível de server-side nas requisições e renderizações.

## Autenticação

- A autenticação ocorre via **Magic Link**.
- Apenas e-mails institucionais (`@id.uff.br`) são válidos para login.
- O fluxo de Magic Link já está implementado no backend e deve servir como referência de integração.

## Integração com o Backend

- O schema do Prisma é a referência para todas as operações de banco de dados.
- Queries, mutations e relações do Prisma devem ser consultadas como modelo para o novo app.
- As tabelas existentes e o fluxo de dados do server fornecem contexto para portar a lógica corretamente.

## Frontend

- O frontend utiliza **Tailwind CSS** e **ShadCN UI**.
- Componentes e padrões visuais existentes servem como referência para manter consistência no design system.
- Classes Tailwind e componentes ShadCN devem ser preservados no port.

## Boas Práticas

- O objetivo é manter consistência com o ecossistema já existente.
- Renderizações server-side devem ser priorizadas sempre que possível.
- A lógica de autenticação e integrações com o banco seguem o padrão já implementado nos apps de referência.
- USE SEMPRE BUN NOS COMANDOS.
- NÃO MANDE COMANDOS PARA RODAR O APP, CONSIDERE ELE JÁ RODANDO, POR FAVOR.
- NÃO FALE PRA ABRIR A PÁGINA, JÁ ESTOU COM ELA ABERTA.