import ariquemesData from './data/ariquemes.json';
import boaVistaData from './data/boa_vista.json';
import manausData from './data/manaus.json';
import portoVelhoData from './data/porto_velho.json';

const normalizeDashboard = (rawData, cidade) => ({
  meta: {
    cidade,
    total: rawData.meta.total,
    especialidades: rawData.meta.especialidades,
    totalProcedimentos: rawData.meta.total_procedimentos,
  },
  status: rawData.status,
  macro: rawData.macro.reduce((map, [label, count]) => ({ ...map, [label]: count }), {}),
  providers: rawData.providers.map(p => ({
    nome: p.nome,
    servico: p.servico,
    macro: p.macro,
    status: p.status,
    sheet: p.sheet,
    n: p.n,
    min: p.min || 0,
    max: p.max || 0,
    media: p.media || 0,
    blocks: p.blocks || [],
  })),
});

export const dashboards = {
  Ariquemes: normalizeDashboard(ariquemesData, 'Ariquemes'),
  'Boa Vista': normalizeDashboard(boaVistaData, 'Boa Vista'),
  Manaus: normalizeDashboard(manausData, 'Manaus'),
  'Porto Velho': normalizeDashboard(portoVelhoData, 'Porto Velho'),
};

export const cities = Object.keys(dashboards);
