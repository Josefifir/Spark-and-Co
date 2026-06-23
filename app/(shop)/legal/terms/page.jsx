export const metadata = {
  title: 'Terms & Conditions | Your Store',
  description: 'Terms and Conditions of sale and use',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
      
      <div className="prose prose-slate max-w-none space-y-8">
        <p className="text-sm text-gray-600">
          <strong>Last Updated:</strong> June 23, 2026
        </p>

        {/* 1. General Terms */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. General Terms</h2>
          <p>
            These Terms and Conditions ("Terms") govern your use of our website and the purchase of products 
            from [Your Company Name] ("we", "us", "our"). By accessing our website or placing an order, 
            you agree to be bound by these Terms.
          </p>
          <p>
            Our registered office is located at [Your Address], [City], [Country]. 
            Company registration number: [Registration Number]. VAT ID: [VAT Number].
          </p>
        </section>

        {/* 2. Age Restriction */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Age Restriction</h2>
          <p>
            Our products are age-restricted and may only be purchased by persons aged 18 years or older. 
            By placing an order, you confirm that you are at least 18 years old. We reserve the right to 
            request proof of age and to refuse service if adequate proof cannot be provided.
          </p>
          <p>
            Age verification is conducted at the point of sale and may be required again upon delivery. 
            Failure to provide valid age verification will result in order cancellation without refund 
            of delivery charges.
          </p>
        </section>

        {/* 3. Product Information */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Product Information</h2>
          <p>
            We make every effort to ensure that product descriptions, images, and prices are accurate. 
            However, we do not warrant that product descriptions or other content is error-free, complete, 
            or current.
          </p>
          <p>
            All prices are displayed in USD and include applicable VAT unless otherwise stated. For EU 
            customers, VAT will be calculated based on your delivery country at checkout.
          </p>
          <p>
            Product availability is subject to change without notice. If a product becomes unavailable 
            after you place an order, we will notify you and offer a refund or alternative product.
          </p>
        </section>

        {/* 4. Ordering Process */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Ordering Process</h2>
          <p>
            When you place an order through our website, you are making an offer to purchase products 
            subject to these Terms. We will send you an order confirmation email acknowledging receipt 
            of your order. This does not constitute acceptance of your offer.
          </p>
          <p>
            A contract is formed when we dispatch the products to you and send a dispatch confirmation 
            email. We reserve the right to refuse any order at our discretion.
          </p>
          <p>
            You are responsible for ensuring that all information provided during the ordering process 
            is accurate and complete, including delivery address and contact details.
          </p>
        </section>

        {/* 5. Payment */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Payment</h2>
          <p>
            We accept the following payment methods:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Credit/Debit Cards (Visa, Mastercard, American Express)</li>
            <li>Cryptocurrency (Bitcoin, Ethereum, USDC via Coinbase Commerce)</li>
            <li>SEPA Direct Debit (EU customers only)</li>
          </ul>
          <p>
            Payment is due immediately upon placing your order. We use secure payment processors 
            (Stripe and Coinbase Commerce) and do not store your payment card details on our servers.
          </p>
          <p>
            All prices are in USD unless otherwise stated. For cryptocurrency payments, the exchange 
            rate is locked at the time of payment initiation and must be completed within the specified 
            time window.
          </p>
        </section>

        {/* 6. Bulk Pricing */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Bulk Pricing Discounts</h2>
          <p>
            Selected products may be eligible for bulk pricing discounts when you purchase multiple 
            quantities. Bulk discounts are automatically applied at checkout based on the quantity 
            of each individual product in your cart.
          </p>
          <p>
            Bulk pricing tiers are displayed on product pages and may include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Buy 3+ items: 10% discount</li>
            <li>Buy 10+ items: 20% discount</li>
            <li>Buy 50+ items: 30% discount</li>
          </ul>
          <p>
            Bulk discounts cannot be combined with promotional discount codes unless explicitly stated. 
            The highest applicable discount will be applied.
          </p>
        </section>

        {/* 7. Shipping & Delivery */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Shipping & Delivery</h2>
          <p>
            We ship to addresses within [specify countries/regions]. Shipping costs are calculated 
            at checkout based on your delivery address and order weight.
          </p>
          <p>
            Estimated delivery times are provided at checkout and begin from the date of dispatch. 
            We are not responsible for delays caused by customs, postal services, or force majeure events.
          </p>
          <p>
            Risk of loss and title for products pass to you upon delivery to the carrier. You are 
            responsible for filing any claims with the carrier for damaged or lost shipments.
          </p>
          <p>
            For age-restricted products, signature upon delivery is required. The recipient must 
            provide valid photo ID proving they are 18 years or older.
          </p>
        </section>

        {/* 8. Right of Withdrawal (Widerrufsrecht) - EU Law */}
        <section className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">8. Right of Withdrawal (Widerrufsrecht)</h2>
          
          <h3 className="text-xl font-semibold mb-3">8.1 Withdrawal Right</h3>
          <p>
            If you are a consumer within the European Union, you have the right to withdraw from this 
            contract within 14 days without giving any reason.
          </p>
          <p>
            The withdrawal period will expire after 14 days from the day on which you acquire, or a 
            third party other than the carrier and indicated by you acquires, physical possession of 
            the goods.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">8.2 How to Exercise Your Withdrawal Right</h3>
          <p>
            To exercise the right of withdrawal, you must inform us of your decision to withdraw from 
            this contract by an unequivocal statement (e.g., a letter sent by post or email).
          </p>
          <p>
            You can contact us at:
          </p>
          <div className="bg-white p-4 rounded border border-blue-200 my-4">
            <p><strong>[Your Company Name]</strong></p>
            <p>[Your Address]</p>
            <p>[City, Postal Code]</p>
            <p>[Country]</p>
            <p>Email: [your-email@example.com]</p>
            <p>Phone: [Your Phone Number]</p>
          </div>
          <p>
            You may use the model withdrawal form provided below, but it is not obligatory.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">8.3 Effects of Withdrawal</h3>
          <p>
            If you withdraw from this contract, we shall reimburse to you all payments received from 
            you, including the costs of delivery (with the exception of the supplementary costs resulting 
            from your choice of a type of delivery other than the least expensive type of standard 
            delivery offered by us), without undue delay and in any event not later than 14 days from 
            the day on which we are informed about your decision to withdraw from this contract.
          </p>
          <p>
            We will carry out such reimbursement using the same means of payment as you used for the 
            initial transaction, unless you have expressly agreed otherwise; in any event, you will 
            not incur any fees as a result of such reimbursement.
          </p>
          <p>
            We may withhold reimbursement until we have received the goods back or you have supplied 
            evidence of having sent back the goods, whichever is the earliest.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">8.4 Return of Goods</h3>
          <p>
            You shall send back the goods or hand them over to us without undue delay and in any event 
            not later than 14 days from the day on which you communicate your withdrawal from this 
            contract to us. The deadline is met if you send back the goods before the period of 14 days 
            has expired.
          </p>
          <p>
            You will have to bear the direct cost of returning the goods. You are only liable for any 
            diminished value of the goods resulting from the handling other than what is necessary to 
            establish the nature, characteristics and functioning of the goods.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">8.5 Exceptions to Right of Withdrawal</h3>
          <p>
            The right of withdrawal does not apply to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Goods that are sealed and were unsealed after delivery and are not suitable for return 
                due to health protection or hygiene reasons</li>
            <li>Goods which are, according to their nature, inseparably mixed with other items after delivery</li>
            <li>Sealed audio or video recordings or sealed software which were unsealed after delivery</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">8.6 Model Withdrawal Form</h3>
          <div className="bg-white p-6 rounded border border-blue-200 my-4 font-mono text-sm">
            <p className="font-bold mb-4">MODEL WITHDRAWAL FORM</p>
            <p className="mb-2">(Complete and return this form only if you wish to withdraw from the contract)</p>
            <p className="mb-2">To: [Your Company Name], [Your Address], [Email]</p>
            <p className="mb-2">I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale 
               of the following goods (*)/for the provision of the following service (*),</p>
            <p className="mb-2">Ordered on (*)/received on (*),</p>
            <p className="mb-2">Name of consumer(s),</p>
            <p className="mb-2">Address of consumer(s),</p>
            <p className="mb-2">Signature of consumer(s) (only if this form is notified on paper),</p>
            <p>Date</p>
            <p className="mt-4 text-xs">(*) Delete as appropriate</p>
          </div>
        </section>

        {/* 9. Returns & Refunds (Non-EU) */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Returns & Refunds (Non-EU Customers)</h2>
          <p>
            For customers outside the European Union, we offer a 14-day return policy for unopened 
            products in their original packaging. To be eligible for a return:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Products must be unused and in the same condition as received</li>
            <li>Products must be in their original packaging with all seals intact</li>
            <li>You must contact us within 14 days of receiving your order</li>
            <li>You must provide proof of purchase (order number)</li>
          </ul>
          <p>
            Return shipping costs are the responsibility of the customer unless the return is due to 
            our error (wrong item shipped, defective product, etc.).
          </p>
          <p>
            Refunds will be processed within 14 days of receiving the returned items. Refunds will be 
            issued to the original payment method.
          </p>
        </section>

        {/* 10. Product Reviews */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Product Reviews</h2>
          <p>
            Customers who have completed a paid order may submit product reviews. All reviews are 
            subject to moderation and approval before being published on our website.
          </p>
          <p>
            By submitting a review, you grant us a non-exclusive, royalty-free, perpetual license to 
            use, reproduce, modify, and display your review content.
          </p>
          <p>
            We reserve the right to reject or remove reviews that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contain offensive, defamatory, or inappropriate content</li>
            <li>Include personal information or contact details</li>
            <li>Are not related to the product being reviewed</li>
            <li>Violate intellectual property rights</li>
            <li>Appear to be fraudulent or incentivized</li>
          </ul>
        </section>

        {/* 11. Intellectual Property */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Intellectual Property</h2>
          <p>
            All content on this website, including text, graphics, logos, images, and software, is the 
            property of [Your Company Name] or its content suppliers and is protected by international 
            copyright laws.
          </p>
          <p>
            You may not reproduce, distribute, modify, or create derivative works from any content on 
            this website without our express written permission.
          </p>
        </section>

        {/* 12. Limitation of Liability */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, 
            special, consequential, or punitive damages, or any loss of profits or revenues, whether 
            incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
          </p>
          <p>
            Our total liability to you for all claims arising from or related to these Terms or your use 
            of our website shall not exceed the amount you paid for the products in question.
          </p>
          <p>
            Nothing in these Terms excludes or limits our liability for death or personal injury caused 
            by our negligence, fraud, or any other liability that cannot be excluded or limited by law.
          </p>
        </section>

        {/* 13. Data Protection */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Data Protection</h2>
          <p>
            We are committed to protecting your personal data in accordance with the General Data 
            Protection Regulation (GDPR) and other applicable data protection laws.
          </p>
          <p>
            For detailed information about how we collect, use, and protect your personal data, 
            please refer to our <a href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </p>
        </section>

        {/* 14. Dispute Resolution */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">14. Dispute Resolution</h2>
          <p>
            If you have any concerns or disputes about our products or services, please contact us 
            first so we can attempt to resolve the issue amicably.
          </p>
          <p>
            <strong>EU Online Dispute Resolution:</strong> The European Commission provides an online 
            dispute resolution platform at{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" 
               className="text-blue-600 hover:underline">
              https://ec.europa.eu/consumers/odr
            </a>
          </p>
          <p>
            We are not obliged to participate in dispute resolution proceedings before a consumer 
            arbitration board, but we are willing to do so.
          </p>
        </section>

        {/* 15. Governing Law */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">15. Governing Law & Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of [Your Country], 
            without regard to its conflict of law provisions.
          </p>
          <p>
            For consumers within the European Union, nothing in these Terms affects your statutory rights 
            under mandatory consumer protection laws in your country of residence.
          </p>
          <p>
            Any disputes arising from these Terms or your use of our website shall be subject to the 
            exclusive jurisdiction of the courts of [Your City/Country], except where mandatory consumer 
            protection laws provide otherwise.
          </p>
        </section>

        {/* 16. Changes to Terms */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">16. Changes to These Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be effective immediately 
            upon posting to this page. Your continued use of our website after changes are posted 
            constitutes your acceptance of the modified Terms.
          </p>
          <p>
            We recommend that you review these Terms periodically for any updates.
          </p>
        </section>

        {/* 17. Severability */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">17. Severability</h2>
          <p>
            If any provision of these Terms is found to be invalid or unenforceable by a court of 
            competent jurisdiction, the remaining provisions shall continue in full force and effect.
          </p>
        </section>

        {/* 18. Contact Information */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">18. Contact Information</h2>
          <p>
            If you have any questions about these Terms & Conditions, please contact us:
          </p>
          <div className="bg-gray-50 p-6 rounded-lg mt-4">
            <p><strong>[Your Company Name]</strong></p>
            <p>[Your Address]</p>
            <p>[City, Postal Code]</p>
            <p>[Country]</p>
            <p className="mt-2">Email: <a href="mailto:[your-email@example.com]" className="text-blue-600 hover:underline">[your-email@example.com]</a></p>
            <p>Phone: [Your Phone Number]</p>
            <p>VAT ID: [Your VAT Number]</p>
            <p>Company Registration: [Registration Number]</p>
          </div>
        </section>

        {/* Footer note */}
        <div className="border-t pt-6 mt-8 text-sm text-gray-600">
          <p>
            <strong>Note:</strong> This document is provided as a template and should be customized 
            to reflect your specific business practices and legal requirements. Please consult with 
            a qualified attorney to ensure compliance with all applicable laws in your jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
