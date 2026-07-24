import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import Home from './pages/Home'
import QuemSomos from './pages/QuemSomos'
import Cotacao from './pages/Cotacao'
import Credenciado from './pages/Credenciado'
import Corretoras from './pages/Corretoras'
import EmBreve from './pages/EmBreve'
import { ROUTES } from './routes'

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

          {/* previstas no menu, ainda em construcao */}
          <Route path={ROUTES.rede} element={<EmBreve />} />
          <Route path={ROUTES.sac} element={<EmBreve />} />

          <Route path="*" element={<EmBreve />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
