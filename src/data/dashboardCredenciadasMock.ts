/**
 * Dados MOCKADOS para a página /dashboard-credenciadas.
 * Nada aqui vem do Supabase — é um conjunto fixo (gerado com seed
 * determinístico) só para visualizar o layout do painel. Alguns nomes de
 * prestadores coincidem com os do cadastro real (supabase/seed.sql) para dar
 * contexto, mas status, valores e quantidades de itens são fictícios.
 */

export type StatusRede = 'Ativo' | 'Descredenciado' | 'Contrato não assinado'

export type CategoriaServico =
  | 'Especialidades médicas'
  | 'Terapias'
  | 'Diagnóstico / SADT'
  | 'Consultas'
  | 'Laboratório'
  | 'Consultas e cirurgias'
  | 'Hospital'
  | 'Fisioterapia'
  | 'Descredenciado'
  | 'Contrato não assinado'

export type ItemTuss = { tuss: string; descricao: string; valor: number }
export type ServicoTabela = { servico: string; tabela: string; valor: number | null }
export type Pacote = { codigo: string; descricao: string; valor: number }

export type PrestadorDash = {
  id: string
  nome: string
  instituicao: string
  servico: string
  categoria: CategoriaServico
  status: StatusRede
  itens: number
  faixaMin: number
  faixaMax: number
  cnpj?: string
  cep?: string
  itensTuss?: ItemTuss[]
  servicosTabela?: ServicoTabela[]
  pacotes?: Pacote[]
  composicao?: string
}

/* ------------------------ PRNG determinístico ------------------------ */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260521)
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)]
const int = (min: number, max: number) => Math.round(min + rnd() * (max - min))

/* --------------------------- entradas "ricas" --------------------------- */
/* Detalhe completo replicado do mockup e da tabela de pacotes fornecida. */

const iotDrSerbino: PrestadorDash = {
  id: 'iot-dr-serbino',
  nome: 'IOT - DR SERBINO',
  instituicao: 'JOSE WILSON SERBINO JUNIOR LIMITADA - INSTITUTO DE ORTOPEDIA',
  servico: 'ORTOPEDIA E TRAUMATOLOGIA',
  categoria: 'Especialidades médicas',
  status: 'Ativo',
  itens: 148,
  faixaMin: 1,
  faixaMax: 2000,
}

const clinicaEnoch: PrestadorDash = {
  id: 'clinica-enoch',
  nome: 'CLINICA ENOCH',
  instituicao: 'UNIDADE DE RADIODIAGNÓSTICO E ULTRA-SONOGRAFIA LTDA',
  servico: 'SADT DIAGNOSTICO',
  categoria: 'Diagnóstico / SADT',
  status: 'Ativo',
  itens: 114,
  faixaMin: 5,
  faixaMax: 7500,
}

const institutoOrtopediaRO: PrestadorDash = {
  id: 'iot-instituto-ortopedia-ro',
  nome: 'IOT -INSTITUTO DE ORTOPEDIA',
  instituicao: 'INSTITUTO DE ORTOPEDIA E TRAUMATOLOGIA DE RONDÔNIA S/S',
  servico: 'ORTOPEDIA E TRAUMATOLOGIA',
  categoria: 'Especialidades médicas',
  status: 'Ativo',
  itens: 114,
  faixaMin: 26,
  faixaMax: 210000,
  cnpj: '50.923.636/0001-83',
  cep: '76801-098',
  pacotes: [
    { codigo: '86001465', descricao: 'PACOTE BLOQUEIO DE NERVO PERIFÉRICO', valor: 200 },
    { codigo: '86001409', descricao: 'PACOTE CIRURGIA DE ARTRODESE CERVICAL 1 NÍVEL/SEGMENTO', valor: 43200 },
    { codigo: '86001408', descricao: 'PACOTE CIRURGIA DE ARTRODESE CERVICAL 2 NÍVEIS/SEGMENTO', valor: 47400 },
    { codigo: '86001401', descricao: 'PACOTE CIRURGIA DE ARTRODESE TORACICA/LOMBAR 1 NÍVEL', valor: 57600 },
    { codigo: '86001402', descricao: 'PACOTE CIRURGIA DE ARTROSE TORACICA/LOMBAR 2 NÍVEIS', valor: 38400 },
    { codigo: '86001410', descricao: 'PACOTE CIRURGIA ENDOSCÓPICA DE COLUNA (HÉRNIA DISCAL)', valor: 38400 },
    { codigo: '86001406', descricao: 'PACOTE CIRURGIA ESCOLIOSE', valor: 210000 },
    { codigo: '86001411', descricao: 'PACOTE DE INFILTRAÇÃO DA COLUNA VERTEBRAL', valor: 4000 },
  ],
  servicosTabela: [{ servico: 'HONORÁRIOS MÉDICOS', tabela: 'PACOTES/TUSS PRÓPRIA', valor: null }],
  composicao:
    'Honorários médicos + primeiro auxiliar + segundo auxiliar instrumentador + material OPME (conforme códigos do pacote).',
}

const institutoVigor: PrestadorDash = {
  id: 'instituto-vigor',
  nome: 'INSTITUTO VIGOR',
  instituicao: 'INSTITUTO VIDEOCIRURGIA GASTROCIRURGIA E OBESIDADE DE RONDONIA',
  servico: 'CONSULTA E CIRURGIAS',
  categoria: 'Consultas e cirurgias',
  status: 'Ativo',
  itens: 17,
  faixaMin: 70,
  faixaMax: 23000,
  cnpj: '14.668.363/0001-04',
  cep: '76803-870',
  itensTuss: [
    { tuss: '10101012', descricao: 'CONSULTA CIRURGIA GERAL', valor: 120 },
    { tuss: '10101012', descricao: 'CONSULTA CIRURGIÃO BARIÁTRICO', valor: 120 },
    { tuss: '50001221', descricao: 'CONSULTA PSICÓLOGO', valor: 80 },
    { tuss: '50000470', descricao: 'SESSÃO PSICÓLOGO', valor: 70 },
    { tuss: '20101104', descricao: 'BIOIMPEDÂNCIA', valor: 100 },
    { tuss: '40102050', descricao: 'MANOMETRIA ESOFÁGICA', valor: 850 },
    { tuss: '40102130', descricao: 'PHMETRIA 24 HRS', valor: 750 },
  ],
  servicosTabela: [{ servico: 'HONORARIOS MÉDICOS', tabela: 'CBHPM 2018 PLENA', valor: null }],
  pacotes: [
    { codigo: '86001412 (40202038)', descricao: 'PACOTE ENDOSCOPIA', valor: 600 },
    { codigo: '86001413 (40202666)', descricao: 'PACOTE COLONOSCOPIA', valor: 800 },
  ],
  composicao:
    'Honorário + materiais + medicamentos + taxa de esterilização + taxa de recuperação pós anestesia + uso de oxigênio + taxa de sala de endoscopia.',
}

const davraNefrologia: PrestadorDash = {
  id: 'davra-nefrologia',
  nome: 'DAVRA SERVIÇOS DE NEFROLOGIA',
  instituicao: 'DAVRA SERVIÇOS DE NEFROLOGIA PORTO VELHO LTDA',
  servico: 'NEFROLOGIA',
  categoria: 'Especialidades médicas',
  status: 'Ativo',
  itens: 22,
  faixaMin: 90,
  faixaMax: 3400,
}

const RICAS = [iotDrSerbino, clinicaEnoch, institutoOrtopediaRO, institutoVigor, davraNefrologia]

/* -------------------- restante da rede (nomes "top 10") -------------------- */

const clinicaDrStenio: PrestadorDash = {
  id: 'clinica-dr-stenio',
  nome: 'CLINICA DR STENIO',
  instituicao: 'SG CLÍNICA - DERMATOLOGIA',
  servico: 'DERMATOLOGIA',
  categoria: 'Especialidades médicas',
  status: 'Ativo',
  itens: 98,
  faixaMin: 15,
  faixaMax: 350,
}

const maisSaude: PrestadorDash = {
  id: 'mais-saude',
  nome: 'MAIS SAUDE',
  instituicao: 'MAIS SAÚDE SERVIÇOS MÉDICOS LTDA',
  servico: 'CLÍNICA MÉDICA',
  categoria: 'Consultas',
  status: 'Ativo',
  itens: 91,
  faixaMin: 20,
  faixaMax: 900,
}

const hospitalSantaMarcelina: PrestadorDash = {
  id: 'hospital-santa-marcelina',
  nome: 'HOSPITAL SANTA MARCELINA DE RONDÔNIA',
  instituicao: 'HOSPITAL SANTA MARCELINA DE RONDÔNIA',
  servico: 'HOSPITAL GERAL',
  categoria: 'Hospital',
  status: 'Ativo',
  itens: 87,
  faixaMin: 500,
  faixaMax: 450000,
}

const fisioclin: PrestadorDash = {
  id: 'fisioclin',
  nome: 'FISIOCLIN',
  instituicao: 'FISIOCLIN - FISIOTERAPIA',
  servico: 'FISIOTERAPIA',
  categoria: 'Terapias',
  status: 'Ativo',
  itens: 79,
  faixaMin: 30,
  faixaMax: 220,
}

const alphaclinDiagnostico: PrestadorDash = {
  id: 'alphaclin-diagnostico',
  nome: 'ALPHACLIN DIAGNÓSTICO',
  instituicao: 'ALPHACLIN CENTRO DE DIAGNÓSTICOS LTDA',
  servico: 'DIAGNÓSTICO POR IMAGEM',
  categoria: 'Diagnóstico / SADT',
  status: 'Ativo',
  itens: 74,
  faixaMin: 25,
  faixaMax: 4200,
}

const hospitalDeOlhosVelloso: PrestadorDash = {
  id: 'hospital-olhos-velloso',
  nome: 'HOSPITALD E OLHOS VELLOSO',
  instituicao: 'HOSPITAL DE OLHOS VELLOSO',
  servico: 'OFTALMOLOGIA',
  categoria: 'Hospital',
  status: 'Ativo',
  itens: 68,
  faixaMin: 60,
  faixaMax: 12000,
}

const hospitalSamaritano: PrestadorDash = {
  id: 'hospital-samaritano',
  nome: 'HOSPITAL SAMAR',
  instituicao: 'HOSPITAL SAMARITANO DE RONDÔNIA',
  servico: 'HOSPITAL GERAL',
  categoria: 'Hospital',
  status: 'Ativo',
  itens: 61,
  faixaMin: 80,
  faixaMax: 15000,
}

const TOP10_EXTRA = [
  clinicaDrStenio,
  maisSaude,
  hospitalSantaMarcelina,
  fisioclin,
  alphaclinDiagnostico,
  hospitalDeOlhosVelloso,
  hospitalSamaritano,
]

/* ------------------------------ preenchimento ------------------------------ */

const NOME_POOL = [
  'Centerclin', 'Diagvida', 'Clínica Absoluta', 'Clínica Viver com Saúde', 'Neurofono',
  'Clínica Sou Luz', 'Clínica Multimed', 'Uniclínicas', 'SG Clínica', 'Instituto Vitaclin',
  'Movein Saúde', 'Fisiopilates', 'Clínica Fisiocordis', 'DNA Laboratórios', 'Ultralab',
  'Vitta Diagnósticos', 'IARO', 'Centro Integrado de Saúde', 'Casa de Saúde Bom Jesus',
  'Clínica Nova Forma', 'Clínica PSA Gondim', 'IVER Instituto Vascular', 'Clínica Crescer Mais',
  'JJ Saúde & Medicina', 'Mara Clínica', 'Clínica Renovar', 'Espaço Terapêutico Vida',
  'Consultório Bem Estar', 'Centro Clínico Aponiã', 'Policlínica São João',
]

const ESPECIALIDADES_POR_CATEGORIA: Record<CategoriaServico, string[]> = {
  'Especialidades médicas': [
    'CARDIOLOGIA', 'ENDOCRINOLOGIA E METABOLOGIA', 'GASTROENTEROLOGIA', 'GINECOLOGIA/OBSTETRÍCIA',
    'NEUROLOGIA', 'PEDIATRIA', 'UROLOGIA', 'REUMATOLOGIA', 'PNEUMOLOGIA', 'DERMATOLOGIA',
    'OFTALMOLOGIA', 'OTORRINOLARINGOLOGIA', 'PSIQUIATRIA', 'GERIATRIA', 'MASTOLOGIA',
  ],
  'Terapias': [
    'FISIOTERAPIA', 'FONOAUDIOLOGIA', 'TERAPIA OCUPACIONAL', 'PSICOLOGIA', 'NUTRIÇÃO', 'ACUPUNTURA',
  ],
  'Diagnóstico / SADT': [
    'RESSONÂNCIA MAGNÉTICA', 'TOMOGRAFIA COMPUTADORIZADA', 'ULTRASSONOGRAFIA', 'RAIO X',
    'DENSITOMETRIA ÓSSEA', 'MAMOGRAFIA DIGITAL BILATERAL', 'ECOCARDIOGRAMA',
  ],
  'Consultas': ['CLÍNICA MÉDICA', 'CLÍNICO GERAL'],
  'Laboratório': ['LABORATÓRIO'],
  'Consultas e cirurgias': ['CIRURGIA GERAL', 'CIRURGIA BARIÁTRICA', 'CIRURGIA VASCULAR'],
  'Hospital': ['HOSPITAL GERAL', 'PRONTO ATENDIMENTO'],
  'Fisioterapia': ['FISIOTERAPIA'],
  'Descredenciado': ['REDE — FORA'],
  'Contrato não assinado': ['REDE — PENDENTE'],
}

/** contagem alvo por categoria (bate com "Distribuição por tipo de serviço") */
const METAS: { categoria: CategoriaServico; total: number; status: StatusRede }[] = [
  { categoria: 'Especialidades médicas', total: 32, status: 'Ativo' },
  { categoria: 'Terapias', total: 24, status: 'Ativo' },
  { categoria: 'Diagnóstico / SADT', total: 13, status: 'Ativo' },
  { categoria: 'Consultas', total: 7, status: 'Ativo' },
  { categoria: 'Laboratório', total: 6, status: 'Ativo' },
  { categoria: 'Consultas e cirurgias', total: 6, status: 'Ativo' },
  { categoria: 'Hospital', total: 6, status: 'Ativo' },
  { categoria: 'Fisioterapia', total: 1, status: 'Ativo' },
  { categoria: 'Descredenciado', total: 3, status: 'Descredenciado' },
  { categoria: 'Contrato não assinado', total: 2, status: 'Contrato não assinado' },
]

function gerarPreenchimento(): PrestadorDash[] {
  const fixas = [...RICAS, ...TOP10_EXTRA]
  const usadosPorCategoria = new Map<CategoriaServico, number>()
  for (const p of fixas) {
    usadosPorCategoria.set(p.categoria, (usadosPorCategoria.get(p.categoria) ?? 0) + 1)
  }

  const geradas: PrestadorDash[] = []
  let n = 0
  for (const meta of METAS) {
    const jaExistentes = usadosPorCategoria.get(meta.categoria) ?? 0
    const faltam = Math.max(0, meta.total - jaExistentes)
    const nomesEsp = ESPECIALIDADES_POR_CATEGORIA[meta.categoria]
    for (let i = 0; i < faltam; i++) {
      n += 1
      const base = pick(NOME_POOL)
      const esp = pick(nomesEsp)
      geradas.push({
        id: `mock-${n}`,
        nome: `${base}${meta.categoria === 'Especialidades médicas' || meta.categoria === 'Terapias' ? ' - ' + esp : ''}`,
        instituicao: `${base.toUpperCase()} SERVIÇOS MÉDICOS LTDA`,
        servico: esp,
        categoria: meta.categoria,
        status: meta.status,
        itens: int(3, 45),
        faixaMin: int(20, 150),
        faixaMax: int(300, 6000),
      })
    }
  }
  return geradas
}

/** Descrições genéricas de item TUSS por categoria, usadas para completar a
 * ficha de quem não tem detalhamento real (todos exceto os 5 casos "ricos"). */
const TERMOS_ITEM_POR_CATEGORIA: Record<CategoriaServico, string[]> = {
  'Especialidades médicas': ['CONSULTA', 'RETORNO', 'AVALIAÇÃO CLÍNICA', 'PARECER MÉDICO'],
  'Terapias': ['SESSÃO', 'AVALIAÇÃO INICIAL', 'RETORNO', 'ATENDIMENTO EM GRUPO'],
  'Diagnóstico / SADT': ['EXAME', 'LAUDO', 'PROCEDIMENTO DIAGNÓSTICO'],
  'Consultas': ['CONSULTA EM CONSULTÓRIO', 'RETORNO', 'VISITA HOSPITALAR'],
  'Laboratório': ['COLETA', 'ANÁLISE LABORATORIAL', 'LAUDO'],
  'Consultas e cirurgias': ['CONSULTA CIRÚRGICA', 'PROCEDIMENTO AMBULATORIAL', 'RETORNO PÓS-OPERATÓRIO'],
  'Hospital': ['DIÁRIA HOSPITALAR', 'TAXA DE SALA', 'PRONTO ATENDIMENTO'],
  'Fisioterapia': ['SESSÃO DE FISIOTERAPIA', 'AVALIAÇÃO FUNCIONAL', 'RETORNO'],
  'Descredenciado': ['CONSULTA (HISTÓRICO)'],
  'Contrato não assinado': ['CONSULTA (EM ANÁLISE)'],
}

const COMPOSICAO_POR_CATEGORIA: Record<CategoriaServico, string> = {
  'Especialidades médicas': 'Honorário profissional + materiais utilizados durante a consulta ou procedimento.',
  'Terapias': 'Honorário do profissional + sala de atendimento + materiais de apoio à sessão.',
  'Diagnóstico / SADT': 'Honorário técnico/médico + insumos do exame + emissão de laudo.',
  'Consultas': 'Honorário médico da consulta em consultório ou visita hospitalar.',
  'Laboratório': 'Coleta + processamento da amostra + laudo assinado por responsável técnico.',
  'Consultas e cirurgias': 'Honorário + materiais + medicamentos + taxa de sala e recuperação pós-procedimento.',
  'Hospital': 'Diária + taxas hospitalares + materiais e medicamentos utilizados na internação.',
  'Fisioterapia': 'Honorário do fisioterapeuta + uso de equipamentos e materiais da sessão.',
  'Descredenciado': 'Prestador fora da rede — composição de valores não se aplica.',
  'Contrato não assinado': 'Contrato em análise — composição de valores ainda não definida.',
}

/** Gera CNPJ/CEP fictícios (não passam em validação de dígito verificador —
 * é só para preencher o layout do mockup). */
function cnpjFicticio(): string {
  const g = () => int(0, 9)
  return `${g()}${g()}.${g()}${g()}${g()}.${g()}${g()}${g()}/0001-${g()}${g()}`
}
function cepPortoVelhoFicticio(): string {
  return `768${int(0, 9)}${int(0, 9)}-${int(0, 9)}${int(0, 9)}${int(0, 9)}`
}

/** Completa a ficha (CNPJ, CEP, itens, tabela e composição) de quem ainda
 * não tem — garante que todo prestador da lista seja expansível. */
function completarFicha(p: PrestadorDash): PrestadorDash {
  if (p.itensTuss?.length) return p // já tem detalhamento próprio (os 5 casos "ricos")

  const termos = TERMOS_ITEM_POR_CATEGORIA[p.categoria]
  const qtde = Math.min(termos.length, Math.max(2, Math.round(p.itens / 40) + 2))
  const passo = (p.faixaMax - p.faixaMin) / qtde
  const itensTuss: ItemTuss[] = Array.from({ length: qtde }, (_, i) => ({
    tuss: String(int(10100000, 59999999)),
    descricao: `${termos[i % termos.length]} - ${p.servico}`,
    valor: Math.round(p.faixaMin + passo * i + passo / 2),
  }))

  return {
    ...p,
    cnpj: p.cnpj ?? cnpjFicticio(),
    cep: p.cep ?? cepPortoVelhoFicticio(),
    itensTuss,
    servicosTabela: p.servicosTabela ?? [
      { servico: 'HONORÁRIOS MÉDICOS', tabela: 'CBHPM 2018 PLENA', valor: null },
    ],
    composicao: p.composicao ?? COMPOSICAO_POR_CATEGORIA[p.categoria],
  }
}

export const TODOS_PRESTADORES: PrestadorDash[] = [
  ...RICAS,
  ...TOP10_EXTRA,
  ...gerarPreenchimento(),
].map(completarFicha)

export const TOP_POR_VALOR: PrestadorDash[] = [
  iotDrSerbino,
  clinicaEnoch,
  institutoOrtopediaRO,
  clinicaDrStenio,
  maisSaude,
  hospitalSantaMarcelina,
  fisioclin,
  alphaclinDiagnostico,
  hospitalDeOlhosVelloso,
  hospitalSamaritano,
]

/* ------------------------------- estatísticas ------------------------------- */

export const STATS = {
  prestadores: TODOS_PRESTADORES.length,
  especialidades: 39,
  itensComValorMapeado: 1792,
  contratosAtivos: TODOS_PRESTADORES.filter((p) => p.status === 'Ativo').length,
  pendencias: TODOS_PRESTADORES.filter((p) => p.status !== 'Ativo').length,
}

export const DISTRIBUICAO_PRESTADORES: { categoria: CategoriaServico; valor: number }[] =
  METAS.map((m) => ({ categoria: m.categoria, valor: m.total }))

export const DISTRIBUICAO_ITENS_CATALOGO: { categoria: CategoriaServico; valor: number }[] = [
  { categoria: 'Especialidades médicas', valor: 612 },
  { categoria: 'Terapias', valor: 398 },
  { categoria: 'Diagnóstico / SADT', valor: 289 },
  { categoria: 'Consultas', valor: 156 },
  { categoria: 'Laboratório', valor: 142 },
  { categoria: 'Consultas e cirurgias', valor: 98 },
  { categoria: 'Hospital', valor: 74 },
  { categoria: 'Descredenciado', valor: 12 },
  { categoria: 'Contrato não assinado', valor: 6 },
  { categoria: 'Fisioterapia', valor: 5 },
]

export const SITUACAO_REDE: { status: StatusRede; total: number; cor: string }[] = [
  { status: 'Ativo', total: STATS.contratosAtivos, cor: '#1f9d6e' },
  { status: 'Descredenciado', total: TODOS_PRESTADORES.filter((p) => p.status === 'Descredenciado').length, cor: '#d9534f' },
  { status: 'Contrato não assinado', total: TODOS_PRESTADORES.filter((p) => p.status === 'Contrato não assinado').length, cor: '#e0902f' },
]
