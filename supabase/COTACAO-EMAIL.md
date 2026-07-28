# Envio de e-mail da cotação — configuração

Fluxo: o formulário em `/cotacao` chama a Edge Function **`enviar-cotacao`**, que
(1) grava o lead na tabela `cotacoes` e (2) envia um e-mail de aviso via **Resend**
para `faleconosco@innovaoperadora.com.br`.

O código já está pronto. Faltam os passos abaixo, que dependem das suas contas.

## 1. Criar a tabela

No painel do Supabase → **SQL Editor**, rode o conteúdo de
[`supabase/cotacoes.sql`](./cotacoes.sql) (uma vez).

## 2. Conta no Resend

1. Crie uma conta grátis em https://resend.com
2. **API Keys** → crie uma chave (guarde o valor `re_...`).
3. Para produção, **Domains** → adicione `innovaoperadora.com.br` e configure os
   registros DNS (SPF/DKIM) que o Resend mostrar. Enquanto o domínio não estiver
   verificado, dá para testar com o remetente `onboarding@resend.dev`.

## 3. Deploy da Edge Function

Precisa do [Supabase CLI](https://supabase.com/docs/guides/cli) instalado e logado:

```bash
supabase login
supabase link --project-ref ltyerpqbpeijxghtnemr
supabase functions deploy enviar-cotacao
```

> `project-ref` é o subdomínio da sua `VITE_SUPABASE_URL`
> (`ltyerpqbpeijxghtnemr`).

## 4. Secrets da função

```bash
supabase secrets set \
  RESEND_API_KEY=re_sua_chave_aqui \
  COTACAO_DESTINO=faleconosco@innovaoperadora.com.br \
  COTACAO_REMETENTE="Innova <onboarding@resend.dev>"
```

Depois de verificar o domínio no Resend (passo 2.3), troque o remetente:

```bash
supabase secrets set COTACAO_REMETENTE="Innova <cotacao@innovaoperadora.com.br>"
```

> `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetados automaticamente na
> função pelo Supabase — não precisa configurar.

## 5. Testar

- Preencha o formulário em `/cotacao` e envie.
- Confira o e-mail em `faleconosco@innovaoperadora.com.br`.
- No Supabase, **Table Editor → cotacoes** deve ter a nova linha.
- Logs da função: **Edge Functions → enviar-cotacao → Logs**.

## Observações

- O lead é gravado **antes** do e-mail. Se o e-mail falhar, o lead não se perde
  (fica na tabela e aparece nos logs).
- A tabela tem RLS: o navegador não insere direto (evita spam) — só a função,
  que usa a service role. A equipe autenticada consegue ler os leads.
