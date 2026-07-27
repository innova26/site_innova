import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Fica `true` quando as variáveis de ambiente do Supabase estão preenchidas.
 * Enquanto for `false`, o site usa os dados estáticos de `data/rede.ts`
 * (fallback), então nada quebra antes do backend estar configurado.
 */
export const supabaseConfigurado = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = supabaseConfigurado
  ? createClient(url as string, anonKey as string)
  : null
