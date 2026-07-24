/** Mascaras e validacoes compartilhadas pelos formularios do site. */

/** (69) 2018-1000 para fixo, (69) 92018-1000 para celular. */
export function mascaraTelefone(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Alterna entre CPF (000.000.000-00) e CNPJ (00.000.000/0000-00). */
export function mascaraDocumento(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function cpfValido(d: string) {
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const digito = (fatia: number) => {
    let soma = 0
    for (let i = 0; i < fatia; i++) soma += Number(d[i]) * (fatia + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10])
}

export function cnpjValido(d: string) {
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false
  const digito = (fatia: number) => {
    const pesos =
      fatia === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let soma = 0
    for (let i = 0; i < fatia; i++) soma += Number(d[i]) * pesos[i]
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  return digito(12) === Number(d[12]) && digito(13) === Number(d[13])
}

/** Devolve a mensagem de erro do documento, ou undefined se estiver ok. */
export function erroDocumento(valor: string, obrigatorio = true) {
  const d = valor.replace(/\D/g, '')
  if (!d) return obrigatorio ? 'Informe o CNPJ ou CPF.' : undefined
  if (d.length !== 11 && d.length !== 14)
    return 'Use 11 dígitos para CPF ou 14 para CNPJ.'
  if (d.length === 11 && !cpfValido(d)) return 'CPF inválido.'
  if (d.length === 14 && !cnpjValido(d)) return 'CNPJ inválido.'
  return undefined
}

export function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())
}

/** Leva o foco ao primeiro campo com erro dentro do formulario. */
export function focarPrimeiroErro() {
  document
    .querySelector<HTMLElement>(
      '.campo.tem-erro input, .campo.tem-erro select, .campo.tem-erro textarea',
    )
    ?.focus()
}
