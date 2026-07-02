export const metadata = {
  title: 'About Us | Strike & Co.',
  description: 'The story behind Strike & Co. — machined lighters for everyday carry.',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-paper mb-2">About Us</h1>
      <p className="text-sm text-steel mb-12">Strike & Co.</p>

      <div className="space-y-10 text-paper-dim leading-relaxed">

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Who We Are</h2>
          <p>
            Strike & Co. is a maker of precision-machined lighters for everyday carry. We design
            every unit to be carried daily, used hard, and last a lifetime — no cheap plastics,
            no throwaway culture.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Our Philosophy</h2>
          <p>
            We believe the tools you carry say something about how you operate. That&apos;s why every
              lighter we produce is spec&apos;d to tight tolerances, pressure-tested, and finished by hand
            before it ships. We build for people who carry tools, not trinkets.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">What We Make</h2>
          <p className="mb-4">
            Our lineup covers three categories, each machined from the same commitment to quality:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><span className="text-paper font-semibold">Torch lighters</span> — high-output, windproof flame for demanding environments.</li>
            <li><span className="text-paper font-semibold">Electric lighters</span> — arc ignition, no butane, airport-ready.</li>
            <li><span className="text-paper font-semibold">Refillable lighters</span> — classic form, premium finish, built to be refilled indefinitely.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-paper mb-3">Age Policy</h2>
          <p>
            All our products are age-restricted. You must be 18 years of age or older to purchase
            from Strike & Co. Age is verified at checkout and may be verified again upon delivery.
          </p>
        </section>

      </div>
    </div>
  );
}
