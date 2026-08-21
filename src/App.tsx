import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import Home from './pages/Home'
import QuemSomos from './pages/QuemSomos'
import Cotacao from './pages/Cotacao'
import Credenciado from './pages/Credenciado'
import Corretoras from './pages/Corretoras'
import Sac from './pages/Sac'
import RedeAtendimento from './pages/RedeAtendimento'
import Admin from './pages/Admin'
import AdminDashboardHome from './pages/AdminDashboardHome'
import AdminCredenciadas from './pages/AdminCredenciadas'
import AdminRedes from './pages/AdminRedes'
import EmBreve from './pages/EmBreve'
import PoliticaPrivacidade from './pages/PoliticaPrivacidade'
import { ROUTES } from './routes'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { useEffect, useState } from 'react'
import { getConsent, subscribe } from './lib/cookieConsent'

/* Só carregamos os scripts de análise se o usuário consentir (LGPD). */
function useAnalyticsConsent() {
  const [enabled, setEnabled] = useState(() => getConsent()?.analytics ?? false)
  useEffect(() => subscribe((c) => setEnabled(c?.analytics ?? false)), [])
  return enabled
}

function App() {
  const analyticsEnabled = useAnalyticsConsent()

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path={ROUTES.home} element={<Home />} />
          <Route path={ROUTES.quemSomos} element={<QuemSomos />} />
          <Route path={ROUTES.cotacao} element={<Cotacao />} />
          <Route path={ROUTES.credenciado} element={<Credenciado />} />
          <Route path={ROUTES.corretoras} element={<Corretoras />} />
          <Route path={ROUTES.sac} element={<Sac />} />
          <Route path={ROUTES.rede} element={<RedeAtendimento />} />
          <Route path={ROUTES.privacidade} element={<PoliticaPrivacidade />} />

          <Route path="*" element={<EmBreve />} />
        </Route>

        {/* área administrativa: fora do layout de marketing.
            Admin.tsx cuida do login e, autenticado, mostra o menu (index)
            ou uma das sub-páginas abaixo dentro do mesmo cabeçalho. */}
        <Route path={ROUTES.admin} element={<Admin />}>
          <Route index element={<AdminDashboardHome />} />
          <Route path="credenciadas" element={<AdminCredenciadas />} />
          <Route path="redes" element={<AdminRedes />} />
        </Route>
      </Routes>
      {analyticsEnabled && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </BrowserRouter>
  )
}

export default App
