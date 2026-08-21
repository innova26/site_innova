import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'

const OPCOES = [
  {
    to: ROUTES.adminCredenciadas,
    titulo: 'Cadastro de Credenciadas',
    descricao:
      'Gerencie a listagem pública de prestadores: cadastrar, editar, excluir e controlar visibilidade.',
  },
  {
    to: ROUTES.adminRedes,
    titulo: 'Dashboard de Redes',
    descricao:
      'Panorama da rede negociada por cidade — KPIs, distribuição por serviço/status e cadastro dos procedimentos de cada prestador.',
  },
]

export default function AdminDashboardHome() {
  return (
    <div className="admin-menu">
      <p className="admin-menu-sub">O que você quer fazer?</p>
      <div className="admin-menu-grid">
        {OPCOES.map((op) => (
          <Link key={op.to} to={op.to} className="admin-menu-card">
            <strong>{op.titulo}</strong>
            <p>{op.descricao}</p>
            <span className="admin-menu-seta">Abrir →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
