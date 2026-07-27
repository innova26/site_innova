/**
 * Dados da Rede de Atendimento (prestadores credenciados).
 *
 * Este arquivo é a ÚNICA fonte de verdade da página: as opções dos filtros
 * (estados, municípios, redes, tipos, especialidades) são derivadas da lista
 * `PRESTADORES` — ou seja, basta cadastrar um prestador aqui que ele aparece
 * na busca e alimenta os selects automaticamente.
 *
 * Os dados abaixo são FICTÍCIOS, apenas para demonstração. Veja o guia
 * `GUIA-REDE-DE-ATENDIMENTO.md` para trocar por dados reais (API/planilha).
 */

export type TipoRecurso =
  | 'Hospital'
  | 'Clínica'
  | 'Laboratório'
  | 'Consultório'
  | 'Pronto atendimento'

/** Ordem em que os tipos aparecem no filtro. */
export const TIPOS: TipoRecurso[] = [
  'Hospital',
  'Clínica',
  'Laboratório',
  'Consultório',
  'Pronto atendimento',
]

export type Estado = {
  /** Sigla usada como valor no filtro. */
  uf: string
  nome: string
}

/** Estados onde a operadora atua (mesma cobertura do site oficial). */
export const ESTADOS: Estado[] = [
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
]

export type Prestador = {
  id: string
  nome: string
  /** Instituição/credenciada à qual o prestador pertence (opcional). */
  instituicao?: string
  /** Profissional(is) responsável(is), ex.: "Dr. Fulano" (opcional). */
  profissional?: string
  /**
   * URL da logo do prestador/instituição (opcional). Pode ser um arquivo em
   * `src/assets`, uma URL pública ou um data URI. Sem logo, o card usa o ícone
   * padrão do tipo de recurso.
   */
  logo?: string
  tipo: TipoRecurso
  especialidades: string[]
  /** Redes/planos em que o prestador é credenciado. */
  redes: string[]
  /** Sigla do estado (deve casar com `ESTADOS[].uf`). */
  uf: string
  municipio: string
  endereco: string
  telefones: string[]
  /** Se aparece na página pública. Ausente = visível. */
  visivel?: boolean
}

export const PRESTADORES: Prestador[] = [
  // ---------------- Amazonas (Manaus) ----------------
  {
    id: 'am-hospital-vida',
    nome: 'Hospital Vida Manaus',
    instituicao: 'Rede Vida',
    // exemplo de logo (SVG embutido); troque pela URL/arquivo real do prestador
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='10' fill='%232f80ed'/%3E%3Cpath d='M21 11h6v10h10v6H27v10h-6V27H11v-6h10z' fill='white'/%3E%3C/svg%3E",
    tipo: 'Hospital',
    especialidades: ['Clínica Geral', 'Cardiologia', 'Ortopedia', 'Pediatria'],
    redes: ['Essencial AM I', 'Executivo Nacional'],
    uf: 'AM',
    municipio: 'Manaus',
    endereco: 'Av. Djalma Batista, 1200 — Chapada, Manaus/AM',
    telefones: ['(92) 3000-1000', '(92) 98800-1000'],
  },
  {
    id: 'am-clinica-coracao',
    nome: 'Clínica do Coração',
    instituicao: 'CardioAM',
    tipo: 'Clínica',
    especialidades: ['Cardiologia'],
    redes: ['Essencial AM I'],
    uf: 'AM',
    municipio: 'Manaus',
    endereco: 'Rua Rio Içá, 45 — Vieiralves, Manaus/AM',
    telefones: ['(92) 3234-5566'],
  },
  {
    id: 'am-lab-analisa',
    nome: 'Laboratório Analisa',
    tipo: 'Laboratório',
    especialidades: ['Análises Clínicas', 'Exames de Imagem'],
    redes: ['Essencial AM I', 'Executivo Nacional'],
    uf: 'AM',
    municipio: 'Manaus',
    endereco: 'Av. Constantino Nery, 900 — Centro, Manaus/AM',
    telefones: ['(92) 3212-7788'],
  },
  {
    id: 'am-dra-lima-derma',
    nome: 'Dra. Helena Lima',
    instituicao: 'Consultório Dermatológico Vieiralves',
    tipo: 'Consultório',
    especialidades: ['Dermatologia'],
    redes: ['Essencial AM I'],
    uf: 'AM',
    municipio: 'Manaus',
    endereco: 'Rua Pará, 220 — Vieiralves, Manaus/AM',
    telefones: ['(92) 99160-2020'],
  },

  // ---------------- Rondônia (Porto Velho / Ariquemes) ----------------
  {
    id: 'ro-hospital-central',
    nome: 'Hospital Central de Porto Velho',
    instituicao: 'Rede Innova',
    tipo: 'Hospital',
    especialidades: [
      'Clínica Geral',
      'Ginecologia',
      'Ortopedia',
      'Neurologia',
    ],
    redes: ['Essencial RO I', 'Executivo Nacional'],
    uf: 'RO',
    municipio: 'Porto Velho',
    endereco: 'Av. Sete de Setembro, 1500 — Centro, Porto Velho/RO',
    telefones: ['(69) 3220-4000'],
  },
  {
    id: 'ro-pronto-24h',
    nome: 'Pronto Atendimento 24h Madeira',
    tipo: 'Pronto atendimento',
    especialidades: ['Clínica Geral', 'Pediatria'],
    redes: ['Essencial RO I'],
    uf: 'RO',
    municipio: 'Porto Velho',
    endereco: 'Av. Jorge Teixeira, 3200 — Nova Porto Velho, Porto Velho/RO',
    telefones: ['(69) 3900-2424'],
  },
  {
    id: 'ro-clinica-mulher',
    nome: 'Clínica da Mulher',
    instituicao: 'Femina Saúde',
    tipo: 'Clínica',
    especialidades: ['Ginecologia', 'Obstetrícia'],
    redes: ['Essencial RO I', 'Master'],
    uf: 'RO',
    municipio: 'Porto Velho',
    endereco: 'Rua Dom Pedro II, 640 — Caiari, Porto Velho/RO',
    telefones: ['(69) 3224-1188', '(69) 99311-1188'],
  },
  {
    id: 'ro-dr-souza-oftalmo',
    nome: 'Dr. Marcos Souza',
    instituicao: 'Centro Oftalmológico Ariquemes',
    tipo: 'Consultório',
    especialidades: ['Oftalmologia'],
    redes: ['Essencial RO I'],
    uf: 'RO',
    municipio: 'Ariquemes',
    endereco: 'Av. Tancredo Neves, 2100 — Setor 03, Ariquemes/RO',
    telefones: ['(69) 3535-7070'],
  },
  {
    id: 'ro-lab-precisao',
    nome: 'Laboratório Precisão',
    tipo: 'Laboratório',
    especialidades: ['Análises Clínicas'],
    redes: ['Essencial RO I', 'Master'],
    uf: 'RO',
    municipio: 'Ariquemes',
    endereco: 'Av. Capitão Silvio, 3400 — Áreas Especiais, Ariquemes/RO',
    telefones: ['(69) 3536-9090'],
  },
  {
    id: 'ro-odonto-sorria',
    nome: 'Sorria Odontologia',
    tipo: 'Clínica',
    especialidades: ['Odontologia'],
    redes: ['Essencial RO I', 'Odonto Nacional'],
    uf: 'RO',
    municipio: 'Porto Velho',
    endereco: 'Rua José de Alencar, 300 — Centro, Porto Velho/RO',
    telefones: ['(69) 3221-5050'],
  },

  // ---------------- Roraima (Boa Vista) ----------------
  {
    id: 'rr-hospital-norte',
    nome: 'Hospital Norte Boa Vista',
    instituicao: 'Rede Innova',
    tipo: 'Hospital',
    especialidades: ['Clínica Geral', 'Cardiologia', 'Pediatria'],
    redes: ['Essencial RR I', 'Executivo Nacional'],
    uf: 'RR',
    municipio: 'Boa Vista',
    endereco: 'Av. Ville Roy, 5800 — São Francisco, Boa Vista/RR',
    telefones: ['(95) 3621-3000'],
  },
  {
    id: 'rr-clinica-neuro',
    nome: 'Instituto de Neurologia de Roraima',
    tipo: 'Clínica',
    especialidades: ['Neurologia'],
    redes: ['Essencial RR I'],
    uf: 'RR',
    municipio: 'Boa Vista',
    endereco: 'Rua Coronel Pinto, 480 — Centro, Boa Vista/RR',
    telefones: ['(95) 3224-6060'],
  },
  {
    id: 'rr-lab-vida',
    nome: 'Laboratório Vida & Saúde',
    tipo: 'Laboratório',
    especialidades: ['Análises Clínicas', 'Exames de Imagem'],
    redes: ['Essencial RR I', 'Executivo Nacional'],
    uf: 'RR',
    municipio: 'Boa Vista',
    endereco: 'Av. Getúlio Vargas, 1200 — Canarinho, Boa Vista/RR',
    telefones: ['(95) 3198-4545'],
  },
  {
    id: 'rr-dra-castro-pediatria',
    nome: 'Dra. Paula Castro',
    instituicao: 'Consultório Pediátrico Canarinho',
    tipo: 'Consultório',
    especialidades: ['Pediatria'],
    redes: ['Essencial RR I', 'Master'],
    uf: 'RR',
    municipio: 'Boa Vista',
    endereco: 'Rua Benjamin Constant, 90 — Canarinho, Boa Vista/RR',
    telefones: ['(95) 99612-3030'],
  },
]

/* ------------------------------------------------------------------ *
 * Derivação das opções dos filtros a partir de PRESTADORES.
 * Assim, cadastrar um prestador novo já popula os selects.
 * ------------------------------------------------------------------ */

const ordenar = (valores: Iterable<string>) =>
  [...new Set(valores)].sort((a, b) => a.localeCompare(b, 'pt-BR'))

/** Municípios de um estado (ou de todos, se `uf` vier vazio). */
export function municipiosDe(lista: Prestador[], uf: string): string[] {
  return ordenar(
    lista.filter((p) => !uf || p.uf === uf).map((p) => p.municipio),
  )
}

/** Todas as redes/planos existentes na base. */
export function todasRedes(lista: Prestador[]): string[] {
  return ordenar(lista.flatMap((p) => p.redes))
}

/** Todas as especialidades existentes na base. */
export function todasEspecialidades(lista: Prestador[]): string[] {
  return ordenar(lista.flatMap((p) => p.especialidades))
}

export type Filtros = {
  uf: string
  municipio: string
  rede: string
  tipo: string
  especialidade: string
  busca: string
}

export const FILTROS_VAZIOS: Filtros = {
  uf: '',
  municipio: '',
  rede: '',
  tipo: '',
  especialidade: '',
  busca: '',
}

/** Aplica todos os filtros (combinação E) sobre a lista de prestadores. */
export function filtrarPrestadores(
  lista: Prestador[],
  filtros: Filtros,
): Prestador[] {
  const termo = filtros.busca.trim().toLowerCase()

  return lista.filter((p) => {
    if (filtros.uf && p.uf !== filtros.uf) return false
    if (filtros.municipio && p.municipio !== filtros.municipio) return false
    if (filtros.rede && !p.redes.includes(filtros.rede)) return false
    if (filtros.tipo && p.tipo !== filtros.tipo) return false
    if (
      filtros.especialidade &&
      !p.especialidades.includes(filtros.especialidade)
    )
      return false

    if (termo) {
      const alvo = [
        p.nome,
        p.instituicao ?? '',
        p.municipio,
        p.endereco,
        p.especialidades.join(' '),
      ]
        .join(' ')
        .toLowerCase()
      if (!alvo.includes(termo)) return false
    }

    return true
  })
}
