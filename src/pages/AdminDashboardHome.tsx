import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'

function IconeCredenciadas() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 3h6v3H9z" />
      <path d="M8 11h8M8 15h5" />
    </svg>
  )
}

function IconeRedes() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21h18" />
      <rect x="5" y="12" width="3.4" height="6" rx="0.6" />
      <rect x="10.3" y="7" width="3.4" height="11" rx="0.6" />
      <rect x="15.6" y="14" width="3.4" height="4" rx="0.6" />
    </svg>
  )
}

function IconeCrm() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 5h16" />
      <path d="M4 5v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5" />
      <path d="M9 10h6M9 14h4" />
      <path d="m15.5 17 1.5 1.5 3-3" />
    </svg>
  )
}

function IconeCases() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5V6a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v13" />
      <path d="M6 17h12" />
      <path d="M6 20.5A1.5 1.5 0 0 1 7.5 19H18v2.5H7.5A1.5 1.5 0 0 1 6 20.5z" />
      <path d="M9.5 8.5h5" />
    </svg>
  )
}

const OPCOES: {
  to: string
  titulo: string
  descricao: string
  icone: ReactNode
}[] = [
  {
    to: ROUTES.adminCredenciadas,
    titulo: 'Cadastro de Credenciadas',
    descricao:
      'Gerencie a listagem pública de prestadores: cadastrar, editar, excluir e controlar visibilidade.',
    icone: <IconeCredenciadas />,
  },
  {
    to: ROUTES.adminRedes,
    titulo: 'Dashboard de Redes',
    descricao:
      'Panorama da rede negociada por cidade — KPIs, distribuição por serviço/status e cadastro dos procedimentos de cada prestador.',
    icone: <IconeRedes />,
  },
  {
    to: ROUTES.adminCrm,
    titulo: 'Controle de CRM',
    descricao:
      'Fluxo de CM entre atendimento, enfermagem e financeiro — abertura, autorização, agendamento e pagamento.',
    icone: <IconeCrm />,
  },
  {
    to: ROUTES.adminCases,
    titulo: 'Case de Estudos — UX/UI Fullstack Developer',
    descricao:
      'Documentação do setor de TI: melhorias de produto, UX/UI e engenharia desenvolvidas na Innova.',
    icone: <IconeCases />,
  },
]

export default function AdminDashboardHome() {
  return (
    <div className="admin-menu">
      <p className="admin-menu-sub">O que você quer fazer?</p>
      <div className="admin-menu-grid">
        {OPCOES.map((op) => (
          <Link key={op.to} to={op.to} className="admin-menu-card">
            <span className="admin-menu-icone">{op.icone}</span>
            <strong>{op.titulo}</strong>
            <p>{op.descricao}</p>
            <span className="admin-menu-seta">Abrir →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
