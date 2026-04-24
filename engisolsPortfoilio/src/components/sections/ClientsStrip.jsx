import { clients } from '../../data/siteContent'

export default function ClientsStrip() {
  const rollingClients = [...clients, ...clients]

  return (
    <section className="clients-strip">
      <p className="clients-label">Trusted by Companies Worldwide</p>

      <div className="clients-scroll-wrap">
        <div className="clients-scroll">
          {rollingClients.map((client, index) => (
            <span key={`${client}-${index}`} className="client-name">
              {client}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
