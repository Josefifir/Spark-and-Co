import Link from "next/link";

export const metadata = {
  title: 'Terms & Conditions | Spark & Co.',
  description: 'Terms and Conditions of sale and use',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-paper mb-2">Terms &amp; Conditions</h1>
      <p className="text-sm text-steel mb-12">Last updated: June 23, 2026</p>

      <div className="space-y-10 text-paper-dim leading-relaxed">

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">1. General Terms</h2>
          <p>These Terms and Conditions ("Terms") govern your use of our website and the purchase of products from Spark &amp; Co. ("we", "us", "our"). By accessing our website or placing an order, you agree to be bound by these Terms.</p>
          <p className="mt-3">Our registered office is located at [Your Address], [City], [Country]. Company registration number: [Registration Number]. VAT ID: [VAT Number].</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">2. Age Restriction</h2>
          <p>Our products are age-restricted and may only be purchased by persons aged 18 years or older. By placing an order, you confirm that you are at least 18 years old. We reserve the right to request proof of age and to refuse service if adequate proof cannot be provided.</p>
          <p className="mt-3">Age verification is conducted at the point of sale and may be required again upon delivery. Failure to provide valid age verification will result in order cancellation without refund of delivery charges.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">3. Product Information</h2>
          <p>We make every effort to ensure that product descriptions, images, and prices are accurate. However, we do not warrant that product descriptions or other content is error-free, complete, or current.</p>
          <p className="mt-3">All prices are displayed in USD and include applicable VAT unless otherwise stated. For EU customers, VAT will be calculated based on your delivery country at checkout.</p>
          <p className="mt-3">Product availability is subject to change without notice. If a product becomes unavailable after you place an order, we will notify you and offer a refund or alternative product.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">4. Ordering Process</h2>
          <p>When you place an order through our website, you are making an offer to purchase products subject to these Terms. We will send you an order confirmation email acknowledging receipt of your order. This does not constitute acceptance of your offer.</p>
          <p className="mt-3">A contract is formed when we dispatch the products to you and send a dispatch confirmation email. We reserve the right to refuse any order at our discretion.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">5. Payment</h2>
          <p className="mb-3">We accept the following payment methods:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Credit/Debit Cards (Visa, Mastercard, American Express)</li>
            <li>Revolut Pay</li>
            <li>Cryptocurrency (Bitcoin via BTCPay Server)</li>
            <li>SEPA Direct Debit (EU customers only)</li>
          </ul>
          <p className="mt-3">Payment is due immediately upon placing your order. We use secure payment processors (Stripe and BTCPay Server) and do not store your payment card details on our servers.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">6. Bulk Pricing Discounts</h2>
          <p>Selected products may be eligible for bulk pricing discounts when you purchase multiple quantities. Bulk discounts are automatically applied at checkout based on the quantity of each individual product in your cart. Bulk discounts cannot be combined with promotional discount codes unless explicitly stated.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">7. Shipping &amp; Delivery</h2>
          <p>Shipping costs are calculated at checkout based on your delivery address and order weight. Estimated delivery times begin from the date of dispatch. We are not responsible for delays caused by customs, postal services, or force majeure events.</p>
          <p className="mt-3">For age-restricted products, signature upon delivery may be required. The recipient must provide valid photo ID proving they are 18 years or older.</p>
        </section>

        <section className="bg-panel border border-hairline rounded-sm p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-paper">8. Right of Withdrawal (Widerrufsrecht)</h2>

          <div>
            <h3 className="font-semibold text-paper mb-2">8.1 Withdrawal Right</h3>
            <p>If you are a consumer within the European Union, you have the right to withdraw from this contract within 14 days without giving any reason. The withdrawal period will expire after 14 days from the day on which you acquire physical possession of the goods.</p>
          </div>

          <div>
            <h3 className="font-semibold text-paper mb-2">8.2 How to Exercise Your Withdrawal Right</h3>
            <p>To exercise the right of withdrawal, you must inform us by an unequivocal statement (e.g., a letter by post or email). You may use the model withdrawal form below, but it is not obligatory.</p>
          </div>

          <div>
            <h3 className="font-semibold text-paper mb-2">8.3 Effects of Withdrawal</h3>
            <p>We shall reimburse all payments received from you, including standard delivery costs, without undue delay and no later than 14 days from notification of your withdrawal. We will use the same means of payment as your initial transaction.</p>
          </div>

          <div>
            <h3 className="font-semibold text-paper mb-2">8.4 Model Withdrawal Form</h3>
            <div className="bg-graphite border border-hairline rounded-sm p-4 font-mono-tech text-xs text-steel space-y-1.5">
              <p className="text-paper font-bold">MODEL WITHDRAWAL FORM</p>
              <p>(Complete and return only if you wish to withdraw from the contract)</p>
              <p>To: Spark &amp; Co., [Address], [Email]</p>
              <p>I/We hereby give notice that I/We withdraw from my/our contract of sale of the following goods,</p>
              <p>Ordered on / received on: _______________</p>
              <p>Name of consumer(s): _______________</p>
              <p>Address: _______________</p>
              <p>Signature (only if notified on paper): _______________</p>
              <p>Date: _______________</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">9. Returns &amp; Refunds</h2>
          <p className="mb-3">For customers outside the EU, we offer a 14-day return policy for unopened products in their original packaging. To be eligible:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Products must be unused and in the same condition as received</li>
            <li>Products must be in their original packaging with all seals intact</li>
            <li>You must contact us within 14 days of receiving your order</li>
          </ul>
          <p className="mt-3">Refunds will be processed within 14 days of receiving the returned items to the original payment method.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">10. Intellectual Property</h2>
          <p>All content on this website, including text, graphics, logos, and images, is the property of Spark &amp; Co. or its content suppliers and is protected by international copyright laws. You may not reproduce or distribute any content without our express written permission.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">11. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages. Our total liability shall not exceed the amount you paid for the products in question. Nothing in these Terms excludes liability for death or personal injury caused by our negligence.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">12. Data Protection</h2>
          <p>We are committed to protecting your personal data in accordance with GDPR. Please refer to our{" "}
            <Link href="/legal/privacy" className="text-flame hover:underline">Privacy Policy</Link>{" "}
            for full details.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">13. Dispute Resolution</h2>
          <p>The European Commission provides an online dispute resolution platform at{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-flame hover:underline">ec.europa.eu/consumers/odr</a>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">14. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of [Your Country]. For EU consumers, nothing in these Terms affects your statutory rights under mandatory consumer protection laws in your country of residence.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">15. Contact Information</h2>
          <div className="bg-panel border border-hairline rounded-sm p-4 font-mono-tech text-sm text-paper space-y-0.5">
            <p className="font-bold">Spark &amp; Co.</p>
            <p>[Your Address], [City, Postal Code], [Country]</p>
            <p>Email: <a href="mailto:[your-email@example.com]" className="text-flame hover:underline">[your-email@example.com]</a></p>
            <p>VAT ID: [Your VAT Number]</p>
          </div>
        </section>

      </div>
    </div>
  );
}
