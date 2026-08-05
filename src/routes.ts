/** Rotas do site, compartilhadas entre o menu, o footer e o roteador. */
export const ROUTES = {
  home: '/',
  quemSomos: '/quem-somos',
  rede: '/rede-de-atendimento',
  cotacao: '/cotacao',
  credenciado: '/seja-um-credenciado',
  corretoras: '/corretoras',
  sac: '/sac',
  privacidade: '/politica-de-privacidade',
  admin: '/admin',
} as const

/** Portais sao sistemas externos, por isso ficam fora do roteador. */
export const PORTAIS = [
  { label: 'Portal do Beneficiário', href: 'https://portal.innovaoperadora.com.br/portal_beneficiario/auth/login' },
  { label: 'Portal do Prestador', href: 'https://portal.innovaoperadora.com.br/prestador/' },
  { label: 'Portal do Corretor', href: 'https://innovaoperadora.com.br' },
  { label: 'Portal da Empresa', href: 'https://portal.innovaoperadora.com.br/empresa/' },
]

export const NAV_ITEMS = [
  { label: 'Início', to: ROUTES.home },
  { label: 'Quem somos', to: ROUTES.quemSomos },
  { label: 'Rede de Atendimento', to: ROUTES.rede },
  { label: 'Cotação', to: ROUTES.cotacao },
  { label: 'Seja um credenciado', to: ROUTES.credenciado },
  { label: 'Corretoras', to: ROUTES.corretoras },
  { label: 'Portais', submenu: PORTAIS },
  { label: 'SAC', to: ROUTES.sac },
]

export const ROUTE_TITLES: Record<string, string> = {
  [ROUTES.rede]: 'Rede de Atendimento',
  [ROUTES.cotacao]: 'Cotação',
  [ROUTES.credenciado]: 'Seja um credenciado',
  [ROUTES.corretoras]: 'Corretoras',
  [ROUTES.sac]: 'SAC',
}
