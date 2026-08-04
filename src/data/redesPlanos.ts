/**
 * Lista base de redes/planos para o multi-select do cadastro.
 * É só o ponto de partida — novas redes podem ser adicionadas na hora pelo
 * componente.
 */
const BRUTA = [
  'ESSENCIAL AM I',
  'ESSENCIAL RO I',
  'ESSENCIAL RO I - ARIQUEMES',
  'ESSENCIAL RO II',
  'ESSENCIAL RR I',
  'MASTER RR I - BOA VISTA',
  'REDE FLEX',
  'REDE MASTER',
]

/** Lista final: sem duplicatas e ordenada em pt-BR. */
export const REDES_PADRAO: string[] = [
  ...new Set(BRUTA.map((r) => r.trim())),
].sort((a, b) => a.localeCompare(b, 'pt-BR'))
