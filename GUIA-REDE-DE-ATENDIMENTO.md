# Guia — Página Rede de Atendimento

Como a busca de prestadores funciona e como deixá-la 100% operacional com dados
reais.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `src/data/rede.ts` | **Fonte única de verdade**: lista de prestadores + tipos + derivação dos filtros. É aqui que você mexe no dia a dia. |
| `src/pages/RedeAtendimento.tsx` | A página: filtros, cascata, contador, cards e estado vazio. Normalmente não precisa tocar. |
| `src/App.tsx` | Rota `/rede-de-atendimento` → `RedeAtendimento`. |
| `src/App.css` | Estilos (bloco `Página: Rede de Atendimento`). |

## Como funciona (visão geral)

1. Todos os prestadores ficam no array `PRESTADORES` em `src/data/rede.ts`.
2. As opções dos selects (**municípios, redes, especialidades**) são
   **derivadas automaticamente** desse array — você **não** mantém listas
   separadas. Cadastrou um prestador com uma especialidade nova? Ela já aparece
   no filtro.
3. Os filtros se combinam (lógica **E**) e o resultado atualiza ao vivo, em
   qualquer ordem. A única cascata é **Estado → Município** (trocar o estado
   zera o município e recarrega a lista de cidades daquele estado).
4. A busca por nome varre nome, instituição, município, endereço e
   especialidades.

## Cadastrar / editar um prestador

Adicione um objeto ao array `PRESTADORES` em `src/data/rede.ts`:

```ts
{
  id: 'ro-clinica-exemplo',           // único, sem espaços (usado como key)
  nome: 'Clínica Exemplo',
  instituicao: 'Grupo Exemplo',       // opcional
  logo: '/logos/exemplo.png',         // opcional; sem logo o card usa o ícone do tipo
  tipo: 'Clínica',                    // ver tipos válidos abaixo
  especialidades: ['Cardiologia', 'Clínica Geral'],
  redes: ['Essencial RO I'],          // planos onde é credenciado
  uf: 'RO',                           // precisa casar com ESTADOS[].uf
  municipio: 'Porto Velho',
  endereco: 'Rua Exemplo, 100 — Centro, Porto Velho/RO',
  telefones: ['(69) 3000-0000'],      // pode ter 1 ou mais
}
```

Regras que evitam bug:

- **`tipo`** deve ser um destes (constante `TIPOS`): `Hospital`, `Clínica`,
  `Laboratório`, `Consultório`, `Pronto atendimento`. O TypeScript acusa erro se
  digitar outro.
- **`uf`** deve existir em `ESTADOS`. Para atender um estado novo, adicione-o
  primeiro no array `ESTADOS`.
- **`especialidades`** e **`redes`** são texto livre; **padronize a grafia**
  (ex.: sempre `Cardiologia`, nunca `cardiologia`), senão viram duas opções
  diferentes no filtro.
- **`telefones`**: escreva como devem aparecer; o link `tel:` é gerado sozinho a
  partir dos dígitos.
- **`logo`** (opcional): URL da imagem — arquivo em `public/` (ex.:
  `/logos/exemplo.png`), import de `src/assets` ou data URI. Se não houver logo,
  o card mostra o ícone padrão do tipo de recurso. A caixa da logo tem fundo
  branco, então PNG/SVG com fundo transparente ficam bem.

Depois de salvar, o Vite recarrega e o prestador já aparece na busca.

## Trocar o mock por dados reais

Os dados atuais são **fictícios**, só para demonstração. Há duas formas de ligar
a uma fonte real mantendo o resto da página intacto — **basta continuar
entregando objetos no formato `Prestador`**.

### Opção A — Planilha / CMS exportado para JSON (mais simples)

Gere um JSON no formato do `Prestador[]` (por export de planilha, Airtable,
Notion, um CMS etc.) e importe:

```ts
// src/data/rede.ts
import prestadoresJson from './prestadores.json'
export const PRESTADORES: Prestador[] = prestadoresJson
```

Mantenha as funções `municipiosDe`, `todasRedes`, `todasEspecialidades` e
`filtrarPrestadores` como estão — elas continuam derivando tudo do array.

### Opção B — API (dados dinâmicos)

Se os prestadores vêm de um endpoint, carregue-os na página com estado:

```tsx
// dentro de RedeAtendimento.tsx
const [prestadores, setPrestadores] = useState<Prestador[]>([])

useEffect(() => {
  fetch('https://SUA-API/prestadores')
    .then((r) => r.json())
    .then(setPrestadores)
    .catch(() => setPrestadores([]))
}, [])
```

E troque as funções de `src/data/rede.ts` para receberem a lista como argumento
(hoje elas leem o `PRESTADORES` do módulo). Exemplo:

```ts
export function filtrarPrestadores(lista: Prestador[], filtros: Filtros) { … }
export function municipiosDe(lista: Prestador[], uf: string) { … }
```

Assim a página passa a lista carregada da API para cada função. O formato de cada
item precisa ser exatamente o do tipo `Prestador`.

> Dica: valide/normalize os dados na borda (ao carregar) para garantir `tipo` e
> `uf` válidos e grafia consistente de especialidades/redes.

## Cadastro real com Supabase (backend + /admin)

A página `/admin` permite à equipe **criar, editar e excluir** prestadores (com
upload de logo) direto no navegador, salvando no Supabase. Enquanto o Supabase
não estiver configurado, o site usa os dados estáticos (fallback) e o `/admin`
mostra um aviso.

### Passo a passo (uma vez)

1. **Criar projeto** em [supabase.com](https://supabase.com) (plano grátis).
2. **Rodar o schema**: abra *SQL Editor* e cole/execute o conteúdo de
   `supabase/schema.sql`. Isso cria a tabela `prestadores`, as políticas de
   segurança (leitura pública, escrita só logado) e o bucket `logos`.
3. **Criar o login da equipe**: *Authentication → Users → Add user* (e-mail +
   senha). Repita para cada pessoa que vai cadastrar.
4. **Pegar as chaves**: *Project Settings → API* → copie a **Project URL** e a
   **anon public key**.
5. **Configurar o front**: copie `.env.example` para `.env` e preencha:

   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key
   ```

   Reinicie o `npm run dev`. Pronto: `/admin` pede login e a página pública
   passa a ler do banco.

> Segurança: a *anon key* é pública, feita para o front — quem protege os dados
> é o RLS (políticas do passo 2). **Nunca** use a `service_role` key no front.

### Como funciona por baixo

- `src/lib/supabase.ts` — cria o cliente e expõe `supabaseConfigurado`.
- `src/data/redeRepo.ts` — lê/grava no Supabase (ou cai no estático). É a única
  camada que fala com o banco; a página e o admin usam essas funções.
- `src/pages/Admin.tsx` — login + tabela + formulário + upload de logo.
- Migrar os dados de exemplo para o banco: cadastre-os pelo `/admin`, ou faça um
  *insert* em massa no SQL Editor a partir de `src/data/rede.ts`.

## Checklist para "deixar funcionando"

- [ ] Substituir os prestadores fictícios pelos reais (Opção A ou B).
- [ ] Conferir a lista de `ESTADOS` (hoje AM, RO, RR).
- [ ] Padronizar a grafia de `especialidades` e `redes`.
- [ ] (Opcional) Preencher a `logo` de cada prestador — sem ela o card usa o
      ícone do tipo. Um exemplo com logo já vem em `Hospital Vida Manaus`.
- [ ] Testar: selecionar estado filtra municípios; combinar filtros; "Limpar
      filtros"; e o estado vazio.
