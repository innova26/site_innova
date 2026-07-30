/**
 * Contatos oficiais da Innova, extraidos dos links do site atual
 * (innovaoperadora.com.br/sac). Fonte unica para paginas e rodape.
 */
export const CONTATOS = {
  /** Beneficiarios e prestadores da rede. */
  central: {
    rotulo: '0800 345 9999',
    telefone: 'tel:08003459999',
    whatsapp: '558003459999',
  },
  /** Time comercial e ouvidoria. */
  comercial: {
    rotulo: '0800 345 9999',
    telefone: 'tel:08003459999',
    whatsapp: '558003459999',
  },
  email: 'faleconosco@innovaoperadora.com.br',
  endereco: {
    rua: 'Av. Sete de Setembro, 2153',
    bairro: 'Nossa Sra. das Graças',
    cidade: 'Porto Velho — RO',
    cep: '76804-123',
    mapa: 'https://maps.google.com/maps?q=Av.%20Sete%20de%20Setembro%2C%202153%20-%20Nossa%20Sra.%20das%20Gra%C3%A7as%2C%20Porto%20Velho%20-%20RO%2C%2076804-123&t=m&z=15&output=embed&iwloc=near',
  },
} as const

/** Monta o link do WhatsApp com mensagem pre-preenchida. */
export function linkWhatsapp(numero: string, mensagem?: string) {
  const base = `https://wa.me/${numero}`
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base
}
