export const metadata = {
  title: 'Impressum | Spark & Co.',
  description: 'Legal information and company details (§5 TMG)',
};

export default function ImpressumPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-paper mb-2">Impressum</h1>
      <p className="text-sm text-steel mb-12">Information according to §5 TMG (Telemediengesetz)</p>

      <div className="space-y-10 text-paper-dim leading-relaxed">

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Company Information</h2>
          <div className="bg-panel border border-hairline rounded-sm p-4 font-mono-tech text-sm text-paper space-y-0.5">
            <p className="font-bold">Spark &amp; Co.</p>
            <p>[Legal Form, e.g., GmbH, UG, Einzelunternehmen]</p>
            <p>[Street Address]</p>
            <p>[Postal Code] [City]</p>
            <p>[Country]</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Contact</h2>
          <div className="space-y-1.5">
            <p><span className="text-paper font-medium">Phone:</span> [+XX XXX XXXXXXX]</p>
            <p><span className="text-paper font-medium">Email:</span>{" "}
              <a href="mailto:[your-email@example.com]" className="text-flame hover:underline">[your-email@example.com]</a>
            </p>
            <p><span className="text-paper font-medium">Website:</span>{" "}
              <a href="https://spark-and-co.vercel.app" className="text-flame hover:underline">spark-and-co.vercel.app</a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Represented By</h2>
          <p><span className="text-paper font-medium">Managing Director / Owner:</span> [Full Name]</p>
          <p className="text-sm text-steel mt-1">(Geschäftsführer / Inhaber)</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Registration Information</h2>
          <div className="space-y-1.5">
            <p><span className="text-paper font-medium">Commercial Register:</span> [Register Court, e.g., Amtsgericht München]</p>
            <p><span className="text-paper font-medium">Registration Number:</span> [HRB XXXXX]</p>
          </div>
          <p className="text-sm text-steel mt-1">(Handelsregister / Registergericht)</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Tax Information</h2>
          <div className="space-y-1.5">
            <p><span className="text-paper font-medium">VAT ID:</span> [DE XXXXXXXXX]</p>
            <p className="text-sm text-steel">(Umsatzsteuer-Identifikationsnummer gemäß §27a UStG)</p>
            <p><span className="text-paper font-medium">Tax Number:</span> [XXX/XXX/XXXXX]</p>
            <p className="text-sm text-steel">(Steuernummer)</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Responsible for Content</h2>
          <p className="text-sm text-steel mb-2">According to §55 Abs. 2 RStV</p>
          <div className="space-y-0.5">
            <p className="text-paper font-medium">[Full Name]</p>
            <p>[Street Address]</p>
            <p>[Postal Code] [City], [Country]</p>
          </div>
        </section>

        <section className="bg-panel border border-hairline rounded-sm p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-paper">Alternative Dispute Resolution</h2>
          <div>
            <h3 className="font-semibold text-paper mb-2">EU Online Dispute Resolution</h3>
            <p>The European Commission provides a platform for online dispute resolution (ODR):{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-flame hover:underline">
                ec.europa.eu/consumers/odr
              </a>
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-paper mb-2">Consumer Arbitration Board</h3>
            <p className="text-sm text-steel mb-1">(Verbraucherschlichtungsstelle)</p>
            <p>We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Liability for Content</h2>
          <p className="text-sm text-steel mb-2">(Haftung für Inhalte)</p>
          <p>As a service provider, we are responsible for our own content on these pages in accordance with general legislation pursuant to Section 7 (1) TMG. However, according to Sections 8 to 10 TMG, we are not obliged to monitor transmitted or stored third-party information. Upon becoming aware of legal violations, we will remove this content immediately.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Liability for Links</h2>
          <p className="text-sm text-steel mb-2">(Haftung für Links)</p>
          <p>Our website contains links to external third-party websites over whose content we have no influence. The linked pages were checked for possible legal violations at the time of linking. Upon becoming aware of legal violations, we will remove such links immediately.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Copyright</h2>
          <p className="text-sm text-steel mb-2">(Urheberrecht)</p>
          <p>The content and works on these pages are subject to German copyright law. Reproduction, distribution, and any exploitation outside the limits of copyright require written consent of the respective author or creator.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Payment Service Providers</h2>
          <p className="text-sm text-steel mb-3">(Zahlungsdienstleister)</p>
          <div className="space-y-4">
            <div className="bg-panel border border-hairline rounded-sm p-4 font-mono-tech text-sm text-paper space-y-0.5">
              <p className="font-bold">Stripe Payments Europe, Ltd.</p>
              <p>1 Grand Canal Street Lower, Grand Canal Dock</p>
              <p>Dublin, D02 H210, Ireland</p>
              <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-flame hover:underline">stripe.com</a>
            </div>
            <div className="bg-panel border border-hairline rounded-sm p-4 font-mono-tech text-sm text-paper space-y-0.5">
              <p className="font-bold">BTCPay Server Foundation</p>
              <p>Self-hosted, open-source Bitcoin payment processor</p>
              <a href="https://btcpayserver.org" target="_blank" rel="noopener noreferrer" className="text-flame hover:underline">btcpayserver.org</a>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Hosting</h2>
          <div className="bg-panel border border-hairline rounded-sm p-4 font-mono-tech text-sm text-paper space-y-0.5">
            <p className="font-bold">Vercel Inc.</p>
            <p>440 N Barranca Ave #4133</p>
            <p>Covina, CA 91723, USA</p>
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-flame hover:underline">vercel.com</a>
          </div>
        </section>

      </div>
    </div>
  );
}
