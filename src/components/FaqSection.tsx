import { useState, type CSSProperties } from 'react'
import { useRevealOnScroll } from '../hooks/useRevealOnScroll'

const FAQS = [
  {
    question: 'Quem pode contratar o Plano Coletivo por Adesão da Innova?',
    answer:
      'Esse plano é destinado a profissionais e estudantes com vínculo a uma entidade de classe, associação, conselho ou sindicato. Caso tenha dúvidas se você se enquadra, entre em contato com nossa equipe e nós ajudamos!',
  },
  {
    question: 'Quais empresas podem contratar o Plano Empresarial (PME)?',
    answer:
      'Empresas a partir de 3 vidas já podem contratar o plano empresarial da Innova. Oferecemos condições especiais para pequenas e médias empresas de Porto Velho e região.',
  },
  {
    question: 'Como posso consultar a rede credenciada do meu plano?',
    answer:
      'Você pode acessar nossa rede credenciada completa através do portal do beneficiário no site. Lá, é possível buscar por especialidade, localização ou nome do profissional.',
  },
  {
    question: 'A Innova cobre atendimentos de emergência e urgência?',
    answer:
      'Sim. Todos os planos da Innova oferecem cobertura para urgência e emergência, de acordo com as diretrizes da ANS. Você estará amparado nos momentos em que mais precisa.',
  },
  {
    question: 'O que são carências em um plano de saúde?',
    answer:
      'Carência é o tempo que você precisa esperar, após contratar o plano, para usar certos serviços. Por exemplo: consultas em até 30 dias e parto em até 300 dias. Esses prazos são definidos pela ANS.',
  },
]

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const listRef = useRevealOnScroll<HTMLDivElement>('.faq-item')

  const toggle = (index: number) =>
    setOpenIndex((current) => (current === index ? null : index))

  return (
    <section className="faq" id="faq">
      <div className="shell">
        <header className="faq-head">
          <p className="section-eyebrow centered">
            <span className="eyebrow-dash" aria-hidden="true" />
            FAQ
          </p>

          <h2 className="section-title centered">
            Perguntas <span className="accent">frequentes</span>
          </h2>

          <p className="section-lead centered">
            Reunimos as dúvidas mais comuns sobre nossos planos, coberturas e
            prazos. Se a sua não estiver aqui, fale com a nossa equipe.
          </p>
        </header>

        <div className="faq-list" ref={listRef}>
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index
            const panelId = `faq-panel-${index}`
            const buttonId = `faq-button-${index}`

            return (
              <div
                key={item.question}
                className={`faq-item${isOpen ? ' is-open' : ''}`}
                style={{ '--delay': `${index * 80}ms` } as CSSProperties}
              >
                <h3 className="faq-question-wrap">
                  <button
                    type="button"
                    id={buttonId}
                    className="faq-question"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(index)}
                  >
                    <span>{item.question}</span>
                    <span className="faq-toggle" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path
                          d="M5 12h14"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                        <path
                          className="toggle-bar"
                          d="M12 5v14"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>
                </h3>

                <div
                  className="faq-answer"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                >
                  <div className="faq-answer-inner">
                    <p>{item.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="faq-footer">
          <p>Não encontrou o que procurava?</p>
          <a className="btn btn-primary" href="https://api.whatsapp.com/send/?phone=558003459999&text=Ol%C3%A1%21+Gostaria+de+saber+mais+sobre+os+planos+da+Innova.&type=phone_number&app_absent=0">
            Falar com um especialista <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}

export default FaqSection
