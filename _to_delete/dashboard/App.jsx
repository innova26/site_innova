import { useMemo, useState } from 'react';
import { cities, dashboards } from './data';
import { ChevronRight, Search } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const colors = ['#075985', '#1687c7', '#55b8d9', '#2f6fa3', '#7aa6c2', '#b5c9d8'];
const statusColors = { Ativo: '#2ea96a', Pendente: '#d98a2b', Descredenciado: '#d0563f' };
const money = (value) => value == null ? '-' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const integer = (value) => value.toLocaleString('pt-BR');

function Icon({ name }) {
  const paths = { search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>, arrow: <path d="m9 6 6 6-6 6" />, plus: <><path d="M12 5v14" /><path d="M5 12h14" /></> };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Header({ dashboard, onCityChange }) {
  return <header className="header">
    <div className="brand">
      <div><span className="eyebrow">Innova</span><h1>Rede Credenciada</h1><p>Panorama da rede, especialidades e ficha completa de cada prestador</p></div>
    </div>
    <label className="city-picker">Cidade<select value={dashboard.meta.cidade} onChange={(event) => onCityChange(event.target.value)}>{cities.map((city) => <option key={city}>{city}</option>)}</select></label>
  </header>;
}

function Kpis({ dashboard }) {
  const active = dashboard.status.find(([status]) => status === 'Ativo')?.[1] || 0;
  return <div className="kpis">{[
    [dashboard.meta.total, 'Prestadores na rede'],
    [dashboard.meta.especialidades, 'Especialidades / serviços distintos'],
    [dashboard.meta.totalProcedimentos, 'Itens com valor mapeado'],
    [active, 'Contratos ativos', `${dashboard.meta.total - active} com pendência`],
  ].map(([value, label, sub]) => <article className="kpi" key={label}><strong>{integer(value)}</strong><span>{label}</span>{sub && <small>{sub}</small>}</article>)}</div>;
}

function Distribution({ dashboard, category, setCategory }) {
  const entries = Object.entries(dashboard.macro).sort(([, a], [, b]) => b - a);
  const data = entries.map(([name, value]) => ({ name, value }));
  const chartHeight = Math.max(200, data.length * 46);
  return <section className="card distribution"><div className="section-heading"><div><h2>Distribuição por tipo de serviço</h2><p>Selecione uma categoria para filtrar a lista</p></div><span className="section-number">{integer(dashboard.meta.total)}</span></div><div className="chart-wrap" style={{ minHeight: chartHeight }}><ResponsiveContainer width="100%" height={chartHeight}><BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 4 }} barCategoryGap={12}><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={145} axisLine={false} tickLine={false} tick={{ fill: '#536b80', fontSize: 12 }} /><Tooltip cursor={{ fill: '#edf4f9' }} formatter={(value) => [integer(value), 'Prestadores']} /><Bar dataKey="value" radius={[0, 6, 6, 0]} onClick={(entry) => setCategory(category === entry.name ? '' : entry.name)}>{data.map((entry, index) => <Cell key={entry.name} fill={category === entry.name ? '#063b63' : colors[index % colors.length]} cursor="pointer" />)}</Bar></BarChart></ResponsiveContainer></div></section>;
}

function Status({ dashboard, status, setStatus }) {
  const total = dashboard.status.reduce((sum, [, value]) => sum + value, 0);
  const data = dashboard.status.map(([name, value]) => ({ name, value }));
  return <section className="card status-card"><div className="section-heading"><div><h2>Situação da rede em treinamento</h2><p>Selecione um status para filtrar</p></div></div><div className="status-layout"><div className="donut chart-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={70} paddingAngle={2} onClick={(entry) => setStatus(status === entry.name ? '' : entry.name)}>{data.map((entry, index) => <Cell key={entry.name} fill={statusColors[entry.name] || colors[index + 1]} cursor="pointer" />)}</Pie><Tooltip formatter={(value) => [integer(value), 'Prestadores']} /></PieChart></ResponsiveContainer><div><strong>{integer(status ? dashboard.status.find(([label]) => label === status)?.[1] || 0 : total)}</strong><small>{status || 'prestadores'}</small></div></div><div className="legend">{dashboard.status.map(([label, value], index) => <button key={label} className={status === label ? 'active' : ''} onClick={() => setStatus(status === label ? '' : label)}><i style={{ background: statusColors[label] || colors[index + 1] }} /><span>{label}</span><strong>{integer(value)}</strong><small>{Math.round(value / total * 100)}%</small></button>)}</div></div></section>;
}

function ExecutiveReadout({ dashboard }) {
  const active = dashboard.status.find(([label]) => label === 'Ativo')?.[1] || 0;
  const largest = [...dashboard.providers].sort((a, b) => b.n - a.n)[0];
  const average = dashboard.meta.total ? Math.round(dashboard.meta.totalProcedimentos / dashboard.meta.total) : 0;
  const activeRate = dashboard.meta.total ? Math.round(active / dashboard.meta.total * 100) : 0;
  return <section className="readout">
    <div className="readout-lead"><span className="eyebrow">Leitura executiva</span><strong>{activeRate}% da rede ativa</strong><p>Visão rápida para priorização da operação e negociação.</p></div>
    <div className="readout-stat"><span>Concentração</span><strong>{largest ? integer(largest.n) : 0}</strong><small>{largest?.nome || 'Sem dados'} lidera em itens</small></div>
    <div className="readout-stat"><span>Densidade média</span><strong>{integer(average)}</strong><small>itens mapeados por prestador</small></div>
    <div className="readout-stat"><span>Faixa observada</span><strong>{largest ? money(largest.max) : '-'}</strong><small>maior valor entre os líderes</small></div>
  </section>;
}

function ProviderCard({ item, open, onToggle }) {
  return <article className={`provider ${open ? 'open' : ''}`}><button className="provider-head" onClick={onToggle}><ChevronRight /><span className="provider-name"><strong>{item.nome}</strong><small>{item.sheet || item.nome}</small></span><span className="tag">{item.servico}</span><span className={`state ${item.status.toLowerCase().replaceAll(' ', '-')}`}><i />{item.status}</span><span className="provider-count">{integer(item.n)}<small>itens</small></span><span className="provider-range">{money(item.min)} - {money(item.max)}</span></button>{open && <div className="provider-body">{item.blocks?.length ? item.blocks.map((block, index) => block.type === 'title' ? <h3 key={index}>{block.text}</h3> : block.type === 'note' ? <p className="note" key={index}>{block.text}</p> : <table key={index}><thead><tr><th>Código</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}><td className="code">{row.cod || '-'}</td><td>{row.desc}</td><td className="value">{typeof row.num === 'number' ? money(row.num) : row.val || '-'}</td></tr>)}</tbody></table>) : <p className="note">Ficha detalhada disponível no arquivo de origem.</p>}</div>}</article>;
}

function Providers({ dashboard, category, status }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);
  const filtered = useMemo(() => dashboard.providers.filter((item) => (!category || item.macro === category) && (!status || item.status === status) && `${item.nome} ${item.servico} ${item.macro}`.toLowerCase().includes(query.toLowerCase())), [dashboard, category, status, query]);
  return <section className="card provider-card"><div className="controls"><label className="search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar prestador ou serviço..." /></label><span className="result-count">{filtered.length} encontrados</span></div><p className="hint"><ChevronRight /> Clique em um prestador para consultar a ficha completa.</p><div className="table-head"><span /><span>Prestador</span><span>Serviço</span><span>Status</span><span>Itens</span><span>Faixa (R$)</span></div>{filtered.map((item) => <ProviderCard item={item} key={item.nome} open={open === item.nome} onToggle={() => setOpen(open === item.nome ? null : item.nome)} />)}{!filtered.length && <p className="empty">Nenhum prestador encontrado com esses filtros.</p>}</section>;
}

export default function App() {
  const [city, setCity] = useState(cities[0]);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const dashboard = dashboards[city];
  const changeCity = (nextCity) => { setCity(nextCity); setCategory(''); setStatus(''); };
  return <main className="shell"><Header dashboard={dashboard} onCityChange={changeCity} /><Kpis dashboard={dashboard} /><ExecutiveReadout dashboard={dashboard} /><div className="overview"><Distribution dashboard={dashboard} category={category} setCategory={setCategory} /><Status dashboard={dashboard} status={status} setStatus={setStatus} /></div><Providers dashboard={dashboard} category={category} status={status} /><footer>Dashboard interno · Innova Operadora / Nativa Saúde · dados organizados por cidade</footer></main>;
}
