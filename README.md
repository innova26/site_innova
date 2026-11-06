<div align="center">

<img src="src/assets/logoinnova_azul.png" alt="Innova" width="220" />

# Site Innova — Web Fullstack

Site institucional da **Innova Operadora de Saúde** com área administrativa interna:
rede de atendimento, formulários de captação de leads, **Controle de CRM** entre setores
e dashboard de redes credenciadas.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%7C%20Auth%20%7C%20Edge-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)

</div>

---

## Sumário

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como rodar localmente](#como-rodar-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Backend (Supabase)](#backend-supabase)
- [Edge Functions](#edge-functions)
- [Controle de CRM](#controle-de-crm)
- [Deploy](#deploy)
- [Scripts](#scripts)
- [Documentação complementar](#documentação-complementar)
- [Autor](#autor)

---

## Visão geral

O projeto é uma SPA em **React + TypeScript** (Vite) que roda na **Vercel** e usa o
**Supabase** como backend (Postgres com RLS, Auth, Storage, Realtime e Edge Functions).

Ele tem duas partes:

| Parte | Público | O que faz |
| --- | --- | --- |
| **Site institucional** | Beneficiários, prestadores, corretores e empresas | Apresenta a operadora, os planos, a rede de atendimento e capta leads (cotação, credenciamento, corretoras). |
| **Área administrativa** (`/admin`) | Equipe interna | Login, gestão de credenciadas e redes, **Controle de CRM** entre setores, painel de indicadores e galeria de estudos de caso. |

O site funciona **mesmo sem o Supabase configurado**: a rede de atendimento cai no
fallback estático de `src/data/rede.ts`, então nada quebra antes do backend estar pronto.

---

## Funcionalidades

### Site público

| Rota | Página |
| --- | --- |
| `/` | Home: hero, planos, seções de mercado, FAQ e divulgação do aplicativo |
| `/quem-somos` | Institucional |
| `/rede-de-atendimento` | Busca de prestadores com filtros combinados (estado → município, rede, tipo, especialidade, nome) |
| `/cotacao` | Formulário de cotação → grava o lead e envia e-mail |
| `/seja-um-credenciado` | Formulário de credenciamento, com upload de portfólio em PDF |
| `/corretoras` | Formulário para corretoras parceiras |
| `/aplicativo` | Divulgação do app (carteirinha digital etc.) |
| `/sac` | Canais de atendimento |
| `/politica-de-privacidade` · `/informacoes-regulatorias` | Páginas legais / ANS |

Também:

- **Menu "Portais"** com links externos (Beneficiário, Prestador, Corretor, Empresa).
- **Consentimento de cookies (LGPD)**: Vercel Analytics e Speed Insights só são carregados depois que o usuário aceita.
- Animações de entrada com `useRevealOnScroll` e modais de aviso/promoção.

### Área administrativa (`/admin`)

| Rota | Módulo |
| --- | --- |
| `/admin` | Login (Supabase Auth) e menu inicial |
| `/admin/credenciadas` | Leads de credenciamento recebidos |
| `/admin/redes` | Dashboard de redes: preços negociados e status de contrato por prestador e cidade (gráficos com Recharts) |
| `/admin/crm` | **Controle de CRM**: solicitações entre Atendimento → Enfermagem → Financeiro |
| `/admin/crm/painel` | Painel de indicadores do CRM |
| `/admin/crm/usuarios` | Gestão de usuários e papéis do CRM (somente `admin`) |
| `/admin/cases` | Galeria de estudos de caso (HTMLs autônomos em `public/casos`) |

As páginas do CRM têm o **Novi**, um assistente guiado (botão flutuante) com respostas
prontas por perfil. Não usa IA externa e não envolve dados de pacientes.

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| UI | React 19, React Router 7, lucide-react, Recharts |
| Linguagem / build | TypeScript 6, Vite 8 (`@vitejs/plugin-react`) |
| Lint | Oxlint |
| Backend | Supabase: Postgres + RLS, Auth, Storage, Realtime, `pg_cron` + `pg_net` |
| Funções serverless | Supabase Edge Functions (Deno) |
| E-mail transacional | [Resend](https://resend.com) |
| Hospedagem / métricas | Vercel, Vercel Analytics, Speed Insights |

---

## Arquitetura

```
                ┌─────────────────────────────┐
  Navegador ───▶│  Vercel (SPA React / Vite)  │
                └──────────────┬──────────────┘
                               │ supabase-js (anon key + JWT do usuário)
                               ▼
        ┌──────────────────────────────────────────────┐
        │                  Supabase                    │
        │  Postgres + RLS · Auth · Storage · Realtime  │
        │                                              │
        │  Edge Functions (service role) ──▶ Resend ──▶ e-mails
        │   enviar-cotacao · enviar-credenciado        │
        │   enviar-corretora · crm-notificar           │
        │   crm-usuarios · crm-faxina ◀── pg_cron      │
        └──────────────────────────────────────────────┘
```

- O front só usa a **anon key** (pública). As permissões ficam nas policies de **RLS**.
- Operações privilegiadas (gravar leads, convidar usuários, mandar e-mail, limpar anexos)
  rodam nas **Edge Functions** com a *service role*, que nunca chega ao navegador.
- O acesso a dados fica isolado em repositórios em `src/data/*Repo.ts`.

---

## Estrutura de pastas

```
.
├── public/
│   ├── casos/                 # Estudos de caso (HTML autônomo + imagens)
│   └── favicon.png, icons.svg
├── src/
│   ├── assets/                # Imagens e logos
│   ├── components/            # Header, footer, layout, seções da home, modais,
│   │                          # CookieConsent, AssistenteCRM (Novi)…
│   ├── data/                  # Dados estáticos e repositórios Supabase
│   │   ├── rede.ts            # Prestadores (fallback) + derivação dos filtros
│   │   ├── *Repo.ts           # Acesso ao Supabase (rede, CRM, cotações…)
│   │   └── redeDashboardJson/ # Base de preços por cidade (origem do seed)
│   ├── hooks/                 # useRevealOnScroll
│   ├── lib/                   # Cliente Supabase, consentimento de cookies
│   ├── pages/                 # Páginas públicas e do /admin
│   ├── utils/                 # Máscaras e validações de formulário
│   ├── routes.ts              # Rotas, menu e portais (fonte única)
│   ├── App.tsx                # Roteador
│   └── main.tsx
├── supabase/
│   ├── *.sql                  # Schemas, seeds e migrações
│   └── functions/             # Edge Functions (Deno)
├── vercel.json                # Rewrites de SPA + cache dos assets
└── vite.config.ts
```

---

## Como rodar localmente

**Pré-requisitos:** Node.js 20+ e npm.

```bash
git clone https://github.com/khemrajuniordev/site_innova_web_fullstack.git
```

```bash
cd site_innova_web_fullstack
```

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run dev
```

O site sobe em `http://localhost:5173`.

> Sem o `.env`, o site público funciona com os dados estáticos. O `/admin`, os
> formulários e o CRM precisam do Supabase configurado.

---

## Variáveis de ambiente

### Front-end (`.env`)

| Variável | Descrição |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase (*Project Settings → API*) |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (anon / publishable). Pode ficar no front. |

> Nunca coloque a `service_role` em variáveis `VITE_*`: tudo que começa com `VITE_`
> vai para o bundle público.

### Edge Functions (`supabase secrets set …`)

| Secret | Usado por | Obrigatório |
| --- | --- | --- |
| `RESEND_API_KEY` | todas que enviam e-mail | sim |
| `COTACAO_REMETENTE` | remetente padrão (ex.: `Innova <cotacao@innovaoperadora.com.br>`) | recomendado |
| `COTACAO_DESTINO` | destino(s) da cotação, separados por vírgula | não (tem padrão) |
| `CREDENCIADO_DESTINO` | destino do credenciamento | não |
| `CORRETORA_DESTINO` | destino do formulário de corretoras | não |
| `CRM_REMETENTE` | remetente dos avisos do CRM | não |
| `CRM_EMAIL_ENFERMAGEM` / `CRM_EMAIL_FINANCEIRO` | quem recebe os avisos de cada etapa | não |
| `CRM_CONVITE_REDIRECT` | para onde o convite de usuário leva | não (padrão `/admin`) |
| `CRM_FAXINA_SECRET` | protege a chamada do cron da faxina | sim, para `crm-faxina` |
| `CRM_FAXINA_DIAS` | idade mínima (dias) das recusas a limpar | não (padrão `90`) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já são injetadas
pelo próprio Supabase.

---

## Backend (Supabase)

Rode os scripts no **SQL Editor** do Supabase, nesta ordem:

| # | Script | Para quê |
| --- | --- | --- |
| 1 | `schema.sql` | Tabela de prestadores da rede de atendimento + RLS |
| 2 | `seed.sql` | Carga inicial de prestadores (452 registros) |
| 3 | `cotacoes.sql` | Leads de `/cotacao` |
| 4 | `credenciados.sql` | Leads de `/seja-um-credenciado` |
| 5 | `rede_dashboard.sql` | Tabelas do dashboard de redes |
| 6 | `rede_dashboard_seed.sql` | Preços/procedimentos por cidade |
| 7 | `crm.sql` | Base do Controle de CRM: perfis, solicitações, triggers e RLS |
| 8 | `crm_anexos.sql` | Bucket e tabela de anexos (documentos e recibos) |
| 9 | `crm_historico.sql` | Trilha de auditoria automática |
| 10 | `crm_realtime.sql` | Liga o Realtime na tabela de solicitações |
| 11 | `crm_cpf.sql`, `crm_tipo.sql`, `crm_motivo_recusa.sql`, `crm_maiusculas.sql`, `crm_fix_delete_usuario.sql` | Migrações incrementais do CRM |
| 12 | `crm_faxina_cron.sql` | Agenda a faxina semanal dos anexos (`pg_cron`) |

> A tabela `corretoras`, usada pela função `enviar-corretora`, ainda não tem script
> versionado neste repositório.

Leia o comentário no topo de cada arquivo antes de rodar: ele diz os pré-requisitos e
se o script deve rodar uma vez só.

---

## Edge Functions

| Função | Gatilho | O que faz |
| --- | --- | --- |
| `enviar-cotacao` | Formulário `/cotacao` | Grava em `cotacoes` e avisa por e-mail |
| `enviar-credenciado` | Formulário `/seja-um-credenciado` | Grava em `credenciados` e envia e-mail com link assinado do PDF |
| `enviar-corretora` | Formulário `/corretoras` | Grava em `corretoras` e avisa por e-mail |
| `crm-notificar` | Mudança de etapa no CRM | Avisa a Enfermagem (nova solicitação) ou o Financeiro (autorizada) |
| `crm-usuarios` | Tela `/admin/crm/usuarios` | Lista, convida e altera usuários. Só para quem tem papel `admin` |
| `crm-faxina` | `pg_cron` semanal | Apaga documentos de solicitações recusadas há mais de N dias |

Deploy (com o [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
supabase login
```

```bash
supabase link --project-ref <project-ref>
```

```bash
supabase functions deploy enviar-cotacao
```

> `crm-faxina` é chamada pelo cron, por isso o deploy é feito com `--no-verify-jwt`.
> A proteção vem do `CRM_FAXINA_SECRET`.

O passo a passo do e-mail (Resend, domínio e DNS) está em
[`supabase/COTACAO-EMAIL.md`](supabase/COTACAO-EMAIL.md).

---

## Controle de CRM

Fluxo de solicitações (consulta ou reembolso) entre três setores:

```
 Atendimento ──abre──▶ Enfermagem ──autoriza──▶ Financeiro ──agenda──▶ Pago
                            │
                            └──recusa (motivo obrigatório)──▶ Não autorizado
```

| Etapa | Cor |
| --- | --- |
| Aguardando enfermagem | Âmbar |
| Aguardando financeiro | Azul |
| Pagamento agendado | Roxo |
| Pago | Verde |
| Não autorizado | Vermelho |

- **Papéis:** `atendimento`, `enfermagem`, `financeiro` e `admin`. Cada setor só edita a
  própria etapa. Isso é garantido no banco (trigger + RLS), não só na interface.
- **Anexos:** o atendimento envia documentos e o financeiro envia o recibo (Supabase Storage).
- **Histórico:** cada marco fica registrado com data/hora do servidor e autor.
- **Tempo real:** a lista se atualiza sozinha para todos os usuários conectados.
- **Avisos por e-mail** a cada troca de etapa (`crm-notificar`).
- **Validações:** valor obrigatório no padrão brasileiro (`1.500,00`), CPF do paciente,
  textos de identificação em maiúsculas.
- **Painel:** indicadores e rankings em `/admin/crm/painel`.
- **Retenção:** documentos de solicitações recusadas são removidos automaticamente depois do prazo configurado.

---

## Deploy

O projeto está configurado para a **Vercel**:

1. Importe o repositório na Vercel (framework: **Vite**).
2. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em *Settings → Environment Variables*.
3. Build command: `npm run build` · Output: `dist`.

O `vercel.json` já cuida de:

- **Rewrites de SPA:** toda rota (exceto `/api/*`) cai no `index.html`, para o React Router funcionar com refresh e links diretos.
- **Cache:** `/assets/*` com cache imutável de 1 ano. `index.html` sempre revalida, então um deploy novo aparece na hora.

---

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Checagem de tipos (`tsc -b`) + build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | Lint com Oxlint |

---

## Documentação complementar

- [`GUIA-REDE-DE-ATENDIMENTO.md`](GUIA-REDE-DE-ATENDIMENTO.md): como a busca de prestadores funciona e como cadastrar/editar prestadores.
- [`supabase/COTACAO-EMAIL.md`](supabase/COTACAO-EMAIL.md): configuração do envio de e-mails (Resend + Edge Functions).
- [`public/casos/`](public/casos): estudos de caso (CRM, Novi, Rede de Atendimento, NativaFácil).

---

## Autor

**Khemraj Junior**, UX/UI Fullstack Developer

[![GitHub](https://img.shields.io/badge/GitHub-khemrajuniordev-181717?logo=github)](https://github.com/khemrajuniordev)

> Projeto privado desenvolvido para a Innova Operadora de Saúde. Os estudos de caso em
> `public/casos` são propriedade intelectual do autor.
