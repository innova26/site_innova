/** Rotas do site, compartilhadas entre o menu, o footer e o roteador. */
export const ROUTES = {
  home: '/',
  quemSomos: '/quem-somos',
  blog: '/blog',
  rede: '/rede-de-atendimento',
  cotacao: '/cotacao',
  credenciado: '/seja-um-credenciado',
  corretoras: '/corretoras',
  sac: '/sac',
} as const

/** Portais sao sistemas externos, por isso ficam fora do roteador. */
export const PORTAIS = [
  { label: 'Portal do Beneficiário', href: 'https://innovaoperadora.com.br' },
  { label: 'Portal do Prestador', href: 'https://innovaoperadora.com.br' },
  { label: 'Portal do Corretor', href: 'https://innovaoperadora.com.br' },
  { label: 'Portal da Empresa', href: 'https://innovaoperadora.com.br' },
]

export const NAV_ITEMS = [
  { label: 'Início', to: ROUTES.home },
  { label: 'Quem somos', to: ROUTES.quemSomos },
  { label: 'Blog', to: ROUTES.blog },
  { label: 'Rede de Atendimento', to: ROUTES.rede },
  { label: 'Cotação', to: ROUTES.cotacao },
  { label: 'Seja um credenciado', to: ROUTES.credenciado },
  { label: 'Corretoras', to: ROUTES.corretoras },
  { label: 'Portais', submenu: PORTAIS },
  { label: 'SAC', to: ROUTES.sac },
]

export const ROUTE_TITLES: Record<string, string> = {
  [ROUTES.blog]: 'Blog',
  [ROUTES.rede]: 'Rede de Atendimento',
  [ROUTES.cotacao]: 'Cotação',
  [ROUTES.credenciado]: 'Seja um credenciado',
  [ROUTES.corretoras]: 'Corretoras',
  [ROUTES.sac]: 'SAC',
}
