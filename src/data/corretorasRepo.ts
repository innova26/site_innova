/**
 * Envio do formulário de parceria com corretoras.
 * Chama a Edge Function `enviar-corretora`, que grava a solicitação
 * e dispara o e-mail de aviso.
 */
import { supabase } from '../lib/supabase'

export type CorretoraInput = {
  nome: string
  documento: string
  susep: string
  cnh: string
  inscricao: string
  endereco: string
  telefone: string
  email: string
}

export async function enviarCorretora(dados: CorretoraInput): Promise<void> {
  if (!supabase) {
    throw new Error('Serviço de corretoras indisponível no momento.')
  }

  const { error } = await supabase.functions.invoke('enviar-corretora', {
    body: dados,
  })

  if (error) throw error
}
