/**
 * Envio do formulário "Seja um credenciado". Quando há PDF de portfólio,
 * sobe o arquivo para o Storage (bucket privado `portfolios`) e passa o
 * caminho para a Edge Function `enviar-credenciado`, que grava o lead e
 * dispara o e-mail de aviso.
 */
import { supabase } from '../lib/supabase'

export type CredenciadoInput = {
  documento: string
  nome: string
  telefone: string
  whatsapp: string
  email: string
  endereco: string
  numero: string
  bairro: string
  cidade: string
  uf: string
  tipo: string
  especialidades: string
  comentario: string
}

export async function enviarCredenciado(
  dados: CredenciadoInput,
  portfolio: File | null,
): Promise<void> {
  if (!supabase) {
    throw new Error('Serviço de credenciamento indisponível no momento.')
  }

  let portfolioPath: string | null = null
  if (portfolio) {
    portfolioPath = `${crypto.randomUUID()}.pdf`
    const { error } = await supabase.storage
      .from('portfolios')
      .upload(portfolioPath, portfolio, {
        contentType: 'application/pdf',
        upsert: false,
      })
    if (error) throw error
  }

  const { error } = await supabase.functions.invoke('enviar-credenciado', {
    body: { ...dados, portfolioPath },
  })

  if (error) throw error
}
