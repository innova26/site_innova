import { type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useRevealOnScroll } from '../hooks/useRevealOnScroll'
import { ROUTES } from '../routes'
import familia from '../assets/familia.png'

/* Pilares: titulo forte + complemento, como no site atual */
const PILARES = [
  {
    titulo: 'Humanização',
    complemento: 'com inovação e cuidado real',
    texto:
      'Aliamos tecnologia e acolhimento para oferecer uma experiência mais humana e eficiente. A inovação nos permite escutar com atenção, entender cada necessidade e entregar um atendimento que respeita a individualidade de quem confia na Innova.',
    icone: 'M12 20s-7-4.5-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.5 12 20 12 20z',
  },
  {
    titulo: 'Personalização',
    complemento: 'do atendimento',
    texto:
      'Cada beneficiário é único. Por isso, nossos atendimentos são personalizados, respeitando a individualidade, as necessidades e o momento de cada pessoa — com acolhimento e atenção real em todas as etapas.',
    icone: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
  },
  {
    titulo: 'Compromisso',
    complemento: 'com a Saúde e Bem-Estar',
    texto:
      'Cuidar da saúde vai além de tratar doenças. Promovemos qualidade de vida com ações de prevenção, orientação contínua e um atendimento que coloca o bem-estar do beneficiário em primeiro lugar.',
    icone: 'M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3zM9 12l2 2 4-4',
  },
  {
    titulo: 'Respeito',
    complemento: 'ao beneficiário',
    texto:
      'Nosso propósito é cuidar com responsabilidade, empatia e ética. Respeitamos o tempo, a história e as escolhas de cada pessoa, oferecendo um atendimento humanizado e transparente.',
    icone: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14v9H5z',
  },
  {
    titulo: 'Expansão e futuro',
    complemento: 'com propósito',
    texto:
      'A Innova nasceu em Porto Velho, mas tem como meta levar seu modelo inovador para mais regiões do Brasil. Crescemos com responsabilidade, sempre focados na excelência e no cuidado com as pessoas.',
    icone: 'M3 17l6-6 4 4 8-8m0 0h-5m5 0v5',
  },
  {
    titulo: 'Verticalização',
    complemento: 'da rede de atendimento',
    texto:
      'Gerenciamos nossa própria rede credenciada, garantindo mais controle sobre a qualidade dos serviços prestados. Isso nos permite oferecer agilidade, integração entre especialidades e maior eficiência nos atendimentos.',
    icone: 'M4 6h16M4 12h16M4 18h10',
  },
]

const MVV = [
  {
    titulo: 'Missão',
    texto:
      'Oferecer planos de saúde acessíveis e de qualidade, com foco na agilidade, no acolhimento e na personalização do atendimento, promovendo bem-estar e segurança em todas as fases da vida dos nossos beneficiários.',
  },
  {
    titulo: 'Visão',
    texto:
      'Ser reconhecida como a operadora de saúde que mais transforma a experiência do beneficiário, expandindo nossa atuação com inovação, responsabilidade e compromisso com o cuidado humanizado.',
  },
  {
    titulo: 'Valores',
    texto:
      'A Innova se guia pelo respeito ao ser humano, pela ética em cada relação e pela busca constante por eficiência, acolhimento e evolução no cuidado com a saúde de quem confia na nossa marca.',
  },
]

const PRACAS = [
  { estado: 'Rondônia', cidade: 'Porto Velho', status: 'Sede' },
  { estado: 'Amazonas', cidade: 'Manaus', status: 'Em operação' },
  { estado: 'Roraima', cidade: 'Boa Vista', status: 'Em operação' },
  { estado: 'Rio de Janeiro', cidade: 'Macaé', status: 'Em breve' },
]

const DEPOIMENTOS = [
  {
    texto:
      'Fiquei surpresa com a qualidade da rede credenciada da Innova. Consegui marcar meus exames com facilidade e os profissionais foram excelentes. É um plano que realmente entrega o que promete.',
    nome: 'Marta Oliveira',
  },
  {
    texto:
      'Desde o início fui muito bem acolhido pela equipe da Innova. Atendimento rápido, claro e humanizado. Tudo o que eu precisava para cuidar da minha saúde com mais segurança e tranquilidade.',
    nome: 'Paulo Mendes',
  },
  {
    texto:
      'Me sentia lesada com o plano anterior: muita demora e pouco retorno. Com a Innova, tudo mudou. Fui bem atendida, resolvi o que precisava e agora estou feliz e tranquila com meu plano de saúde.',
    nome: 'Camila Duarte',
  },
]

function QuemSomos() {
  const pilaresRef = useRevealOnScroll<HTMLDivElement>('.pilar-card')
  const pracasRef = useRevealOnScroll<HTMLDivElement>('.praca-card')
  const depoRef = useRevealOnScroll<HTMLDivElement>('.depo-card')

  return (
    <>
      {/* ---------- Abertura ---------- */}
      <section className="page-hero quem-hero">
        <div className="shell">
          <div className="quem-hero-copy">
            <nav className="crumbs" aria-label="Trilha">
              <Link to={ROUTES.home}>Início</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Quem somos</span>
            </nav>

            <h1 className="page-title">
              Uma nova forma de cuidar
              <br />
              da sua <span className="accent">saúde</span>
            </h1>

            <p className="page-lead">
              A Innova nasceu para transformar o acesso à saúde com inovação,
              tecnologia e atendimento humanizado. Já em operação em Porto Velho
              e em expansão para outras regiões, oferecemos planos acessíveis,
              com uma rede credenciada qualificada e uma equipe preparada para
              atender com agilidade e acolhimento.
            </p>

            <p className="page-highlight">
              Aqui, saúde é prioridade. E o cuidado é contínuo.
            </p>
          </div>
        </div>

        <img className="quem-hero-img" src={familia} alt="Família sorrindo" />
      </section>

      {/* ---------- Expansão ---------- */}
      <section className="expansao">
        <div className="shell">
          <p className="section-eyebrow">
            <span className="eyebrow-dash" aria-hidden="true" />
            PRESENÇA
          </p>

          <h2 className="section-title">
            Expansão com propósito,
            <br />
            presença com <span className="accent">confiança</span>
          </h2>

          <p className="section-lead">
            Com raízes em Rondônia e atuação já presente no Amazonas, Roraima e
            Rio de Janeiro, a Innova segue ampliando sua presença pelo Brasil.
            Nossa missão é levar saúde de qualidade com atendimento humanizado a
            cada vez mais pessoas, unindo inovação, estrutura e acolhimento em
            cada nova conexão.
          </p>

          <div className="pracas-grid" ref={pracasRef}>
            {PRACAS.map((praca, i) => (
              <article
                key={praca.cidade}
                className="praca-card"
                style={{ '--delay': `${i * 90}ms` } as CSSProperties}
              >
                <span className="praca-pin" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="10"
                      r="2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                </span>
                <h3>{praca.cidade}</h3>
                <p className="praca-estado">{praca.estado}</p>
                <span
                  className={`praca-status${
                    praca.status === 'Em breve' ? ' is-soon' : ''
                  }`}
                >
                  {praca.status}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Cuidado ---------- */}
      <section className="cuidado">
        <div className="shell cuidado-inner">
          <div>
            <p className="section-eyebrow on-dark">
              <span className="eyebrow-dash" aria-hidden="true" />
              NOSSO JEITO
            </p>

            <h2 className="section-title on-dark">
              Mais do que um plano, uma relação de{' '}
              <span className="accent">cuidado verdadeiro</span>
            </h2>
          </div>

          <div className="cuidado-texto">
            <p>
              Na Innova, acreditamos que saúde de verdade começa com empatia,
              escuta e compromisso. Por isso, desenvolvemos um modelo de
              atendimento centrado nas pessoas, com profissionais preparados,
              estrutura acolhedora e um time que realmente se importa com cada
              história.
            </p>
            <p>
              Nosso foco vai além de consultas e exames: é criar vínculos,
              acompanhar trajetórias e estar presente em todos os momentos da
              vida dos nossos beneficiários, da infância à melhor idade.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Pilares ---------- */}
      <section className="pilares">
        <div className="shell">
          <div className="pilares-head">
            <p className="section-eyebrow">
              <span className="eyebrow-dash" aria-hidden="true" />
              PILARES
            </p>
            <h2 className="section-title">
              Gestão com propósito
              <br />e <span className="accent">resultados</span>
            </h2>
            <p className="section-lead">
              A Innova avança com o apoio de uma diretoria estratégica e
              altamente preparada, que une competência, visão de futuro e foco
              no cuidado com as pessoas. Com uma gestão moderna, eficiente e
              centrada na inovação, a operadora consolida um modelo sustentável
              e comprometido com a qualidade.
            </p>
          </div>

          <div className="pilares-grid" ref={pilaresRef}>
            {PILARES.map((pilar, i) => (
              <article
                key={pilar.titulo}
                className="pilar-card"
                style={{ '--delay': `${i * 80}ms` } as CSSProperties}
              >
                <span className="pilar-icone" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d={pilar.icone}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3>
                  {pilar.titulo}
                  <span className="pilar-complemento">{pilar.complemento}</span>
                </h3>
                <p>{pilar.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Missão, Visão e Valores ---------- */}
      <section className="mvv">
        <div className="shell">
          <div className="mvv-grid">
            {MVV.map((item) => (
              <article key={item.titulo} className="mvv-card">
                <h2>{item.titulo}</h2>
                <p>{item.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Depoimentos ---------- */}
      <section className="depoimentos">
        <div className="shell">
          <div className="depo-head">
            <p className="section-eyebrow centered">
              <span className="eyebrow-dash" aria-hidden="true" />
              DEPOIMENTOS
            </p>
            <h2 className="section-title centered">
              Veja o que nossos beneficiários dizem sobre a{' '}
              <span className="accent">experiência com a gente</span>
            </h2>
            <p className="section-lead centered">
              Confira alguns depoimentos de clientes que encontraram aqui o
              respeito, a agilidade e a tranquilidade que procuravam.
            </p>
          </div>

          <div className="depo-grid" ref={depoRef}>
            {DEPOIMENTOS.map((depo, i) => (
              <figure
                key={depo.nome}
                className="depo-card"
                style={{ '--delay': `${i * 100}ms` } as CSSProperties}
              >
                <span className="aspas" aria-hidden="true">
                  &ldquo;
                </span>
                <blockquote>{depo.texto}</blockquote>
                <figcaption>
                  <strong>{depo.nome}</strong>
                  <span>Cliente Innova</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="cta-final">
        <div className="shell cta-inner">
          <div>
            <h2>Quer evoluir com a gente?</h2>
            <p>
              Faça parte da rede de profissionais e instituições que compartilham
              do nosso compromisso com a saúde de qualidade, acessível e
              humanizada. A Innova está em constante crescimento — e você pode
              crescer junto.
            </p>
          </div>

          <div className="cta-acoes">
            <Link className="btn btn-primary" to={ROUTES.credenciado}>
              Seja um credenciado <span aria-hidden="true">→</span>
            </Link>
            <Link className="btn btn-ghost" to={ROUTES.cotacao}>
              Fazer uma cotação
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default QuemSomos
