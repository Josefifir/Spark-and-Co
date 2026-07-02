export const metadata = {
  title: 'Contact | Strike & Co.',
  description: 'Get in touch with Strike & Co. — support, wholesale enquiries, and press.',
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-paper mb-2">Contact</h1>
      <p className="text-sm text-steel mb-12">We typically reply within one business day.</p>

      <div className="space-y-10 text-paper-dim leading-relaxed">

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-4">Get in Touch</h2>
          <div className="bg-panel border border-hairline rounded-sm p-6 space-y-3 font-mono-tech text-sm text-paper">
            <p className="font-bold">Strike & Co.</p>
            <p>[Your Address], [City, Postal Code], [Country]</p>
            <p>
              Email:{' '}
              <a
                href="mailto:support@strikeandco.com"
                className="text-flame hover:underline"
              >
                support@strikeandco.com
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Customer Support</h2>
          <p>
            For questions about an existing order, shipping, or returns, please email us with your
            order number and we&apos;ll get back to you promptly.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Wholesale & Trade</h2>
          <p>
            Interested in stocking Strike &amp; Co. products? Reach out to us with details about your
            business and we&apos;ll send over our trade catalogue and pricing.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Press & Media</h2>
          <p>
            For press enquiries, review samples, or media assets, contact us via email with the
            subject line <span className="text-paper font-semibold">&ldquo;Press Enquiry&rdquo;</span>.
          </p>
        </section>

      </div>
    </div>
  );
}
