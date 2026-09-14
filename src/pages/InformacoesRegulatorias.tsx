import { useState, type ReactNode } from 'react'

type InformacaoRegulatoria = {
  categoria: string
  data: string
  titulo: string
  conteudo: ReactNode
}

const INFORMACOES: InformacaoRegulatoria[] = [
  {
    categoria: 'Reajuste',
    data: '14 de setembro de 2026',
    titulo: 'Reajuste do Plano de Saúde Innova para Contratos com até 29 vidas - RN 565',
    conteudo: (
      <>
        <h3>Reajuste de planos coletivos com menos de 30 beneficiários (Agrupamento de Contratos) ou PME</h3>
        <p>
          As operadoras devem reunir em um grupo único todos os seus contratos
          coletivos com menos de 30 beneficiários para aplicação do mesmo
          percentual de reajuste.
        </p>
        <p>
          Essa medida, chamada de <strong>Agrupamento de Contratos</strong>, tem
          como objetivo a diluição do risco desses contratos para aplicação do
          reajuste ao consumidor, conferindo maior equilíbrio no índice
          calculado em razão do maior número de beneficiários considerados.
          Índice por agrupamento ficou em <strong>5,11%</strong>. A partir de
          <strong> 01/10/2026</strong>.
        </p>

        <h3 id="reajuste-planos-coletivos">Reajuste para planos coletivos</h3>
        <p>
          O reajuste do Plano de Saúde Innova, para planos coletivos com até 29
          vidas que fizerem parte do agrupamento de contratos, conforme determina
          a Resolução Normativa nº 565/2022, será aplicado no período abaixo
          informado, conforme mês de aniversário do contrato. Consulte o
          percentual de reajuste e a relação dos contratos:
        </p>

        <div className="regulatoria-detalhe">
          <h4>Reajuste do Plano de Saúde Innova para Contratos com até 29 vidas - RN 565</h4>
          <p>
            O reajuste do Plano de Saúde Innova para planos coletivos com até 29
            vidas que fizeram parte do agrupamento de contratos, conforme
            determina a Resolução Normativa nº 565/22, é de <strong>5,11%</strong>,
            aplicado no período de outubro de 2026 a outubro de 2027, conforme o
            mês de aniversário do contrato.
          </p>
          <p>Veja a relação abaixo:</p>
        </div>
      </>
    ),
  },
]

function InformacoesRegulatorias() {
  const [aberta, setAberta] = useState<number | null>(null)

  return (
    <section className="regulatorias-page">
      <div className="shell">
        <h1 className="regulatorias-title">
          Exibindo todas as {INFORMACOES.length} Informações Regulatórias
        </h1>

        <div className="regulatorias-list">
          {INFORMACOES.map((informacao, index) => {
            const isOpen = aberta === index

            return (
              <article className="regulatoria-card" key={informacao.titulo}>
                <div className="regulatoria-meta">
                  <span>{informacao.categoria}</span>
                  <time>{informacao.data}</time>
                </div>

                <h2>{informacao.titulo}</h2>

                <button
                  className="regulatoria-toggle"
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`informacao-${index}`}
                  onClick={() => setAberta(isOpen ? null : index)}
                >
                  <span className="regulatoria-chevron" aria-hidden="true">
                    ›
                  </span>
                  {isOpen ? 'Fechar Informação Regulatória' : 'Abrir Informações Regulatória'}
                </button>

                <div
                  className={`regulatoria-content${isOpen ? ' is-open' : ''}`}
                  id={`informacao-${index}`}
                  hidden={!isOpen}
                >
                  {informacao.conteudo}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default InformacoesRegulatorias