/**
 * Envio do formulário de cotação. Chama a Edge Function `enviar-cotacao`,
 * que grava o lead na tabela `cotacoes` e dispara o e-mail de aviso.
 */
import { supabase } from '../lib/supabase'

export type CotacaoInput = {
  plano: string
  pessoas: string
  nome: string
  email: string
  telefone: string
}

export async function enviarCotacao(dados: CotacaoInput): Promise<void> {
  if (!supabase) {
    throw new Error('Serviço de cotação indisponível no momento.')
  }

  const { error } = await supabase.functions.invoke('enviar-cotacao', {
    body: dados,
  })

  if (error) throw error
}
