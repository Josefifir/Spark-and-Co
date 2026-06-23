export const metadata = {
  title: 'Impressum | Your Store',
  description: 'Legal information and company details',
};

export default function ImpressumPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Impressum</h1>
      
      <div className="prose prose-slate max-w-none space-y-8">
        <p className="text-sm text-gray-600">
          Information according to §5 TMG (Telemediengesetz)
        </p>

        {/* Company Information */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Company Information</h2>
          <div className="space-y-2">
            <p><strong>[Your Company Name]</strong></p>
            <p>[Legal Form, e.g., GmbH, UG, Einzelunternehmen]</p>
            <p>[Street Address]</p>
            <p>[Postal Code] [City]</p>
            <p>[Country]</p>
          </div>
        </section>

        {/* Contact Information */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact</h2>
          <div className="space-y-2">
            <p><strong>Phone:</strong> [+XX XXX XXXXXXX]</p>
            <p><strong>Email:</strong> <a href="mailto:[your-email@example.com]" className="text-blue-600 hover:underline">[your-email@example.com]</a></p>
            <p><strong>Website:</strong> <a href="https://[your-domain.com]" className="text-blue-600 hover:underline">[your-domain.com]</a></p>
          </div>
        </section>

        {/* Represented By */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Represented By</h2>
          <div className="space-y-2">
            <p><strong>Managing Director / Owner:</strong> [Full Name]</p>
            <p className="text-sm text-gray-600">
              (Geschäftsführer / Inhaber)
            </p>
          </div>
        </section>

        {/* Registration Information */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Registration Information</h2>
          <div className="space-y-2">
            <p><strong>Commercial Register:</strong> [Register Court, e.g., Amtsgericht München]</p>
            <p><strong>Registration Number:</strong> [HRB XXXXX]</p>
            <p className="text-sm text-gray-600">
              (Handelsregister / Registergericht)
            </p>
          </div>
        </section>

        {/* Tax Information */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Tax Information</h2>
          <div className="space-y-2">
            <p><strong>VAT ID:</strong> [DE XXXXXXXXX]</p>
            <p className="text-sm text-gray-600">
              (Umsatzsteuer-Identifikationsnummer gemäß §27a Umsatzsteuergesetz)
            </p>
            <p><strong>Tax Number:</strong> [XXX/XXX/XXXXX]</p>
            <p className="text-sm text-gray-600">
              (Steuernummer)
            </p>
          </div>
        </section>

        {/* Responsible for Content */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Responsible for Content</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              According to §55 Abs. 2 RStV (Rundfunkstaatsvertrag)
            </p>
            <p><strong>[Full Name]</strong></p>
            <p>[Street Address]</p>
            <p>[Postal Code] [City]</p>
            <p>[Country]</p>
          </div>
        </section>

        {/* Professional Association (if applicable) */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Professional Association</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              (Berufsbezeichnung und berufsrechtliche Regelungen)
            </p>
            <p><strong>Professional Title:</strong> [If applicable, e.g., Rechtsanwalt]</p>
            <p><strong>Awarded in:</strong> [Country]</p>
            <p><strong>Professional Association:</strong> [Name of Chamber/Association]</p>
            <p><strong>Applicable Professional Regulations:</strong> [Relevant laws/regulations]</p>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Note: Remove this section if not applicable to your business.
          </p>
        </section>

        {/* Supervisory Authority (if applicable) */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Supervisory Authority</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              (Zuständige Aufsichtsbehörde)
            </p>
            <p><strong>[Name of Authority]</strong></p>
            <p>[Street Address]</p>
            <p>[Postal Code] [City]</p>
            <p>[Country]</p>
            <p><strong>Website:</strong> <a href="[authority-website]" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">[authority-website]</a></p>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Note: Only required for regulated industries (e.g., financial services, healthcare).
          </p>
        </section>

        {/* Alternative Dispute Resolution */}
        <section className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Alternative Dispute Resolution</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">EU Online Dispute Resolution</h3>
              <p>
                The European Commission provides a platform for online dispute resolution (ODR):
              </p>
              <p>
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:underline">
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Our email address can be found above in the Impressum.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Consumer Arbitration Board</h3>
              <p className="text-sm text-gray-600">
                (Verbraucherschlichtungsstelle)
              </p>
              <p>
                We are not willing or obliged to participate in dispute resolution proceedings before 
                a consumer arbitration board.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Note: Adjust this statement based on your legal obligations. Some industries are 
                required to participate in consumer arbitration.
              </p>
            </div>
          </div>
        </section>

        {/* Liability for Content */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Liability for Content</h2>
          <p className="text-sm text-gray-600 mb-3">
            (Haftung für Inhalte)
          </p>
          <p>
            As a service provider, we are responsible for our own content on these pages in accordance 
            with general legislation pursuant to Section 7 (1) TMG. However, according to Sections 8 to 10 
            TMG, we are not obliged as a service provider to monitor transmitted or stored third-party 
            information or to investigate circumstances that indicate illegal activity.
          </p>
          <p className="mt-4">
            Obligations to remove or block the use of information in accordance with general legislation 
            remain unaffected by this. However, liability in this regard is only possible from the time 
            of knowledge of a specific infringement. Upon becoming aware of corresponding legal violations, 
            we will remove this content immediately.
          </p>
        </section>

        {/* Liability for Links */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Liability for Links</h2>
          <p className="text-sm text-gray-600 mb-3">
            (Haftung für Links)
          </p>
          <p>
            Our website contains links to external third-party websites over whose content we have no 
            influence. Therefore, we cannot assume any liability for this third-party content. The 
            respective provider or operator of the pages is always responsible for the content of the 
            linked pages.
          </p>
          <p className="mt-4">
            The linked pages were checked for possible legal violations at the time of linking. Illegal 
            content was not recognizable at the time of linking. However, permanent monitoring of the 
            content of the linked pages is not reasonable without concrete evidence of an infringement. 
            Upon becoming aware of legal violations, we will remove such links immediately.
          </p>
        </section>

        {/* Copyright */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Copyright</h2>
          <p className="text-sm text-gray-600 mb-3">
            (Urheberrecht)
          </p>
          <p>
            The content and works created by the site operators on these pages are subject to German 
            copyright law. The reproduction, editing, distribution, and any kind of exploitation outside 
            the limits of copyright require the written consent of the respective author or creator.
          </p>
          <p className="mt-4">
            Downloads and copies of this site are only permitted for private, non-commercial use. Insofar 
            as the content on this site was not created by the operator, the copyrights of third parties 
            are respected. In particular, third-party content is marked as such. Should you nevertheless 
            become aware of a copyright infringement, please inform us accordingly. Upon becoming aware 
            of legal violations, we will remove such content immediately.
          </p>
        </section>

        {/* Data Protection */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Protection</h2>
          <p className="text-sm text-gray-600 mb-3">
            (Datenschutz)
          </p>
          <p>
            The use of our website is generally possible without providing personal data. Insofar as 
            personal data (e.g., name, address, or email addresses) is collected on our pages, this is 
            always done on a voluntary basis as far as possible.
          </p>
          <p className="mt-4">
            For detailed information about how we handle your personal data, please refer to our{' '}
            <a href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </p>
        </section>

        {/* Age Verification */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Age Verification</h2>
          <p className="text-sm text-gray-600 mb-3">
            (Jugendschutz / Altersprüfung)
          </p>
          <p>
            Our products are subject to age restrictions and may only be sold to persons aged 18 years 
            or older. We implement age verification measures in accordance with the German Youth 
            Protection Act (Jugendschutzgesetz - JuSchG).
          </p>
          <p className="mt-4">
            <strong>Youth Protection Officer:</strong> [Name, if applicable]<br />
            <strong>Email:</strong> [youth-protection@example.com]
          </p>
          <p className="text-sm text-gray-600 mt-4">
            Note: A Youth Protection Officer is required for certain types of content/products under 
            German law.
          </p>
        </section>

        {/* Online Dispute Resolution */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Information on Online Dispute Resolution</h2>
          <p className="text-sm text-gray-600 mb-3">
            According to Regulation (EU) No. 524/2013
          </p>
          <p>
            The European Commission provides a platform for online dispute resolution (OS) which can 
            be accessed at{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" 
               className="text-blue-600 hover:underline">
              https://ec.europa.eu/consumers/odr
            </a>.
          </p>
          <p className="mt-4">
            Consumers have the option of using this platform to resolve their disputes. Our email 
            address can be found in the contact information above.
          </p>
        </section>

        {/* Image Credits */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Image Credits</h2>
          <p className="text-sm text-gray-600 mb-3">
            (Bildnachweise)
          </p>
          <p>
            Images and graphics used on this website are either:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Created by us and protected by copyright</li>
            <li>Licensed from stock photo providers (e.g., Shutterstock, Adobe Stock, Unsplash)</li>
            <li>Provided by manufacturers/suppliers with permission for commercial use</li>
            <li>Used under Creative Commons licenses with proper attribution</li>
          </ul>
          <p className="mt-4">
            Specific image credits:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
            <li>[Image description]: [Source/Photographer] - [License]</li>
            <li>[Add specific credits as needed]</li>
          </ul>
        </section>

        {/* Technical Service Provider */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Technical Service Provider</h2>
          <p className="text-sm text-gray-600 mb-3">
            (Technischer Dienstleister)
          </p>
          <div className="space-y-2">
            <p><strong>Hosting Provider:</strong> [Hosting Company Name]</p>
            <p>[Street Address]</p>
            <p>[Postal Code] [City]</p>
            <p>[Country]</p>
            <p><strong>Website:</strong> <a href="[hosting-provider-url]" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">[hosting-provider-url]</a></p>
          </div>
        </section>

        {/* Payment Service Providers */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Payment Service Providers</h2>
          <p className="text-sm text-gray-600 mb-3">
            (Zahlungsdienstleister)
          </p>
          <p>
            We use the following payment service providers for processing payments:
          </p>
          <div className="space-y-4 mt-4">
            <div>
              <p><strong>Stripe Payments Europe, Ltd.</strong></p>
              <p>1 Grand Canal Street Lower, Grand Canal Dock</p>
              <p>Dublin, D02 H210, Ireland</p>
              <p><a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://stripe.com</a></p>
            </div>
            <div>
              <p><strong>Coinbase Commerce</strong></p>
              <p>Coinbase, Inc.</p>
              <p>100 Pine Street, Suite 1250</p>
              <p>San Francisco, CA 94111, USA</p>
              <p><a href="https://commerce.coinbase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://commerce.coinbase.com</a></p>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="border-t pt-6 mt-8">
          <h2 className="text-2xl font-semibold mb-4">Disclaimer</h2>
          <p className="text-sm text-gray-600">
            This Impressum template is provided for informational purposes. Please ensure all 
            information is accurate and complete for your specific business. Consult with a German 
            attorney to ensure full compliance with §5 TMG and other applicable laws.
          </p>
          <p className="text-sm text-gray-600 mt-4">
            <strong>Important:</strong> Replace all placeholder text marked with [brackets] with your 
            actual business information. Remove sections that don't apply to your business (e.g., 
            Professional Association, Supervisory Authority).
          </p>
        </section>

        {/* Last Updated */}
        <div className="text-sm text-gray-600 mt-8">
          <p><strong>Last Updated:</strong> June 23, 2026</p>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
