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
import EmBreve from './pages/EmBreve'
import { ROUTES } from './routes'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

function App() {
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

          <Route path="*" element={<EmBreve />} />
        </Route>

        {/* área administrativa: fora do layout de marketing */}
        <Route path={ROUTES.admin} element={<Admin />} />
      </Routes>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  )
}

export default App
