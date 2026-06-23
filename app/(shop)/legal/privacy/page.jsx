import { Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Lighter Shop",
  description: "Our privacy policy and data protection information",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-flame" />
        <h1 className="font-display text-3xl font-bold text-paper">Privacy Policy</h1>
      </div>
      
      <p className="text-sm text-paper-dim mb-8">
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">1. Introduction</h2>
          <p className="text-paper-dim leading-relaxed">
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website
            and use our services. We are committed to protecting your privacy and complying with the General Data Protection
            Regulation (GDPR) and other applicable data protection laws.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">2. Data Controller</h2>
          <p className="text-paper-dim leading-relaxed mb-2">
            The data controller responsible for your personal data is:
          </p>
          <div className="bg-panel border border-hairline rounded-sm p-4">
            <p className="text-paper font-mono-tech text-sm">
              [Your Company Name]<br />
              [Street Address]<br />
              [Postal Code] [City]<br />
              Germany<br />
              <br />
              Email: privacy@example.com<br />
              Phone: +49 (0) XXX XXXXXXX
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">3. Information We Collect</h2>
          
          <h3 className="font-display text-lg font-semibold text-paper mb-3 mt-6">3.1 Personal Information</h3>
          <p className="text-paper-dim leading-relaxed mb-2">
            We collect the following personal information when you use our services:
          </p>
          <ul className="list-disc list-inside text-paper-dim space-y-2 ml-4">
            <li>Name and contact information (email address, shipping address)</li>
            <li>Payment information (processed securely by our payment providers)</li>
            <li>Order history and purchase information</li>
            <li>Age verification data (verification result only, not birth date)</li>
            <li>Communication preferences</li>
          </ul>

          <h3 className="font-display text-lg font-semibold text-paper mb-3 mt-6">3.2 Automatically Collected Information</h3>
          <ul className="list-disc list-inside text-paper-dim space-y-2 ml-4">
            <li>IP address and browser information</li>
            <li>Device information and operating system</li>
            <li>Cookies and similar tracking technologies</li>
            <li>Usage data and analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">4. How We Use Your Information</h2>
          <p className="text-paper-dim leading-relaxed mb-2">
            We use your personal data for the following purposes:
          </p>
          <ul className="list-disc list-inside text-paper-dim space-y-2 ml-4">
            <li><strong className="text-paper">Order Processing:</strong> To process and fulfill your orders</li>
            <li><strong className="text-paper">Communication:</strong> To send order confirmations, shipping updates, and customer service messages</li>
            <li><strong className="text-paper">Legal Compliance:</strong> To comply with legal obligations, including age verification and VAT requirements</li>
            <li><strong className="text-paper">Service Improvement:</strong> To improve our website and services</li>
            <li><strong className="text-paper">Marketing:</strong> To send promotional emails (only with your consent)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">5. Legal Basis for Processing (GDPR)</h2>
          <p className="text-paper-dim leading-relaxed mb-2">
            We process your personal data based on the following legal grounds:
          </p>
          <ul className="list-disc list-inside text-paper-dim space-y-2 ml-4">
            <li><strong className="text-paper">Contract Performance:</strong> Processing necessary to fulfill our contract with you (Art. 6(1)(b) GDPR)</li>
            <li><strong className="text-paper">Legal Obligation:</strong> Processing required by law, such as tax and accounting requirements (Art. 6(1)(c) GDPR)</li>
            <li><strong className="text-paper">Legitimate Interest:</strong> Processing necessary for our legitimate business interests (Art. 6(1)(f) GDPR)</li>
            <li><strong className="text-paper">Consent:</strong> Processing based on your explicit consent, such as marketing communications (Art. 6(1)(a) GDPR)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">6. Cookies and Tracking Technologies</h2>
          <p className="text-paper-dim leading-relaxed mb-4">
            We use cookies and similar tracking technologies to enhance your browsing experience. You can manage your cookie
            preferences through our cookie consent banner.
          </p>
          
          <h3 className="font-display text-lg font-semibold text-paper mb-3">Cookie Categories:</h3>
          <ul className="list-disc list-inside text-paper-dim space-y-2 ml-4">
            <li><strong className="text-paper">Necessary Cookies:</strong> Required for website functionality (cannot be disabled)</li>
            <li><strong className="text-paper">Analytics Cookies:</strong> Help us understand how visitors use our website</li>
            <li><strong className="text-paper">Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
            <li><strong className="text-paper">Preference Cookies:</strong> Remember your settings and preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">7. Data Sharing and Third Parties</h2>
          <p className="text-paper-dim leading-relaxed mb-2">
            We may share your information with the following third parties:
          </p>
          <ul className="list-disc list-inside text-paper-dim space-y-2 ml-4">
            <li><strong className="text-paper">Payment Processors:</strong> Stripe for credit card and SEPA payments</li>
            <li><strong className="text-paper">Shipping Partners:</strong> To deliver your orders</li>
            <li><strong className="text-paper">Email Service Providers:</strong> To send transactional and marketing emails</li>
            <li><strong className="text-paper">Analytics Providers:</strong> Google Analytics (if you consent)</li>
            <li><strong className="text-paper">Legal Authorities:</strong> When required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">8. Data Retention</h2>
          <p className="text-paper-dim leading-relaxed">
            We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy:
          </p>
          <ul className="list-disc list-inside text-paper-dim space-y-2 ml-4 mt-2">
            <li>Order data: 10 years (German tax law requirement)</li>
            <li>Marketing consent: Until you withdraw consent</li>
            <li>Account data: Until account deletion</li>
            <li>Cookie consent: 12 months</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">9. Your Rights Under GDPR</h2>
          <p className="text-paper-dim leading-relaxed mb-2">
            You have the following rights regarding your personal data:
          </p>
          <ul className="list-disc list-inside text-paper-dim space-y-2 ml-4">
            <li><strong className="text-paper">Right of Access:</strong> Request a copy of your personal data</li>
            <li><strong className="text-paper">Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong className="text-paper">Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
            <li><strong className="text-paper">Right to Restriction:</strong> Limit how we use your data</li>
            <li><strong className="text-paper">Right to Data Portability:</strong> Receive your data in a structured format</li>
            <li><strong className="text-paper">Right to Object:</strong> Object to processing based on legitimate interests</li>
            <li><strong className="text-paper">Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
          </ul>
          <p className="text-paper-dim leading-relaxed mt-4">
            To exercise these rights, please contact us at privacy@example.com
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">10. Data Security</h2>
          <p className="text-paper-dim leading-relaxed">
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized
            access, alteration, disclosure, or destruction. This includes:
          </p>
          <ul className="list-disc list-inside text-paper-dim space-y-2 ml-4 mt-2">
            <li>SSL/TLS encryption for data transmission</li>
            <li>Secure payment processing (PCI DSS compliant)</li>
            <li>Regular security audits and updates</li>
            <li>Access controls and authentication</li>
            <li>Data backup and recovery procedures</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">11. International Data Transfers</h2>
          <p className="text-paper-dim leading-relaxed">
            Your data may be transferred to and processed in countries outside the European Economic Area (EEA). We ensure
            appropriate safeguards are in place, such as Standard Contractual Clauses approved by the European Commission.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">12. Children's Privacy</h2>
          <p className="text-paper-dim leading-relaxed">
            Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal data
            from children. If you believe we have collected data from a child, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">13. Changes to This Policy</h2>
          <p className="text-paper-dim leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the
            new policy on this page and updating the "Last updated" date. Continued use of our services after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">14. Supervisory Authority</h2>
          <p className="text-paper-dim leading-relaxed">
            If you believe we have not handled your personal data properly, you have the right to lodge a complaint with
            the relevant supervisory authority:
          </p>
          <div className="bg-panel border border-hairline rounded-sm p-4 mt-4">
            <p className="text-paper font-mono-tech text-sm">
              <strong>For Germany:</strong><br />
              Die Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI)<br />
              Graurheindorfer Str. 153<br />
              53117 Bonn<br />
              Germany<br />
              <br />
              Website: www.bfdi.bund.de
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-paper mb-4">15. Contact Us</h2>
          <p className="text-paper-dim leading-relaxed mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="bg-panel border border-hairline rounded-sm p-4">
            <p className="text-paper font-mono-tech text-sm">
              Email: privacy@example.com<br />
              Phone: +49 (0) XXX XXXXXXX<br />
              Address: [Your Company Address]
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

// Made with Bob
