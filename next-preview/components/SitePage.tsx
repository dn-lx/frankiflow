type Lang = "de" | "en";

const copy = {
  de: {
    nav: { services: "Leistungen", about: "Über uns", faq: "FAQ", contact: "Kontakt" },
    hero: {
      kicker: "GEBÄUDEREINIGUNG · FRANKFURT",
      titleA: "Saubere Räume.",
      titleB: "Klare Abläufe.",
      body: "Professionelle Reinigung und Objektbetreuung für Büros, Wohnungen, Treppenhäuser und Ferienunterkünfte — zuverlässig, transparent und persönlich.",
      primary: "Preis sofort berechnen",
      secondary: "Angebot anfragen",
      trust: ["Frankfurt & Umgebung", "Transparente Kalkulation", "Persönlicher Ansprechpartner"]
    },
    panel: {
      eyebrow: "FRANKIFLOW PREISRECHNER",
      title: "Ihr Richtpreis in wenigen Schritten.",
      rows: [["01", "Leistung wählen"], ["02", "Fläche & Rhythmus"], ["03", "Preis sofort sehen"]],
      cta: "Jetzt berechnen",
      note: "Kostenlos & unverbindlich"
    },
    strip: [
      ["25%", "Neukundenrabatt im ersten Monat"],
      ["6", "Reinigungs- & Objektservices"],
      ["DE · EN", "Bilingualer Kundenservice"],
      ["100%", "Klare Absprachen & transparente Preise"]
    ],
    servicesEyebrow: "LEISTUNGEN",
    servicesTitle: "Reinigung, die sich Ihrem Alltag anpasst.",
    servicesBody: "Von der regelmäßigen Büroreinigung bis zum Airbnb-Turnover: klar definierte Leistungen, direkte Kommunikation und ein Preis, den Sie vorab verstehen.",
    services: [
      ["01", "Büroreinigung", "Planbare Reinigung für Büros, Praxen und Gewerbeflächen.", "Büro & Gewerbe"],
      ["02", "Wohnungsreinigung", "Zuverlässige Unterhaltsreinigung für Wohnungen und Privathaushalte.", "Privathaushalt"],
      ["03", "Airbnb & Ferienwohnung", "Schneller Turnover, saubere Übergaben und gastfertige Räume.", "Turnover"],
      ["04", "Treppenhausreinigung", "Regelmäßige Pflege für Eingänge, Treppen und Gemeinschaftsflächen.", "Mehrfamilienhaus"],
      ["05", "Grund- & Endreinigung", "Intensive Reinigung für Einzug, Auszug oder besonderen Bedarf.", "Intensivreinigung"],
      ["06", "Objektbetreuung", "Praktische Betreuung rund um Ihre Immobilie und laufende Abläufe.", "Objektservice"]
    ],
    promise: {
      eyebrow: "UNSER ANSATZ",
      title: "Servicequalität trifft auf digitale Transparenz.",
      body: "FrankiFlow verbindet persönliche Betreuung mit digitalen Werkzeugen. Sie sehen Preise, Leistungen und nächste Schritte klar — ohne unnötige Reibung.",
      items: [
        ["01", "Transparent", "Richtpreise online berechnen und Leistungen nachvollziehen."],
        ["02", "Persönlich", "Direkter Ansprechpartner statt anonymer Servicekette."],
        ["03", "Verlässlich", "Klare Absprachen, definierter Leistungsumfang und saubere Übergaben."]
      ]
    },
    processEyebrow: "SO FUNKTIONIERT'S",
    processTitle: "Von der Anfrage zur sauberen Fläche.",
    process: [
      ["1", "Preis berechnen", "Leistung, Fläche und Häufigkeit auswählen."],
      ["2", "Details abstimmen", "Objekt, Zugang und Leistungsumfang gemeinsam klären."],
      ["3", "Reinigung starten", "Termin bestätigen und zuverlässig durchführen."]
    ],
    about: {
      eyebrow: "ÜBER FRANKIFLOW",
      title: "Mehr als Reinigung.",
      body1: "FrankiFlow steht für professionelle Gebäudereinigung und Objektbetreuung in Frankfurt am Main und Umgebung.",
      body2: "Unser Anspruch: gute Arbeit vor Ort mit einer modernen, unkomplizierten Kundenerfahrung verbinden — vom ersten Richtpreis bis zur laufenden Betreuung.",
      quote: "Sauberkeit soll kein komplizierter Prozess sein."
    },
    faqEyebrow: "FAQ",
    faqTitle: "Kurz beantwortet.",
    faq: [
      ["Was kostet eine Reinigung?", "Der Preis hängt von Leistung, Fläche, Häufigkeit und Zusatzleistungen ab. Mit dem Preisrechner erhalten Sie sofort einen unverbindlichen Richtpreis."],
      ["Kann die Büroreinigung außerhalb der Arbeitszeiten stattfinden?", "Ja. Zeiten und Zugang stimmen wir passend zu Ihrem Betrieb und den Gegebenheiten vor Ort ab."],
      ["Bringt FrankiFlow Reinigungsmittel mit?", "Auf Wunsch können Reinigungsmittel und Equipment als Zusatzleistung gestellt werden."],
      ["Gibt es regelmäßige Verträge?", "Ja. Je nach Reinigungsrhythmus sind wiederkehrende Einsätze und verschiedene Vertragslaufzeiten möglich."]
    ],
    contact: {
      eyebrow: "BEREIT?",
      title: "Lassen Sie uns Ihr Objekt sauber und unkompliziert organisieren.",
      body: "Starten Sie mit einem Richtpreis oder sprechen Sie direkt mit uns.",
      calc: "Preis berechnen",
      mail: "E-Mail schreiben"
    },
    footer: "Gebäudereinigung & Objektbetreuung · Frankfurt am Main & Umgebung"
  },
  en: {
    nav: { services: "Services", about: "About", faq: "FAQ", contact: "Contact" },
    hero: {
      kicker: "PROFESSIONAL CLEANING · FRANKFURT",
      titleA: "Clean spaces.",
      titleB: "Clear processes.",
      body: "Professional cleaning and property care for offices, homes, stairwells and holiday rentals — reliable, transparent and personal.",
      primary: "Calculate price now",
      secondary: "Request a quote",
      trust: ["Frankfurt & surroundings", "Transparent pricing", "Personal contact"]
    },
    panel: {
      eyebrow: "FRANKIFLOW PRICE CALCULATOR",
      title: "Your estimate in a few simple steps.",
      rows: [["01", "Choose service"], ["02", "Area & frequency"], ["03", "See price instantly"]],
      cta: "Calculate now",
      note: "Free & non-binding"
    },
    strip: [
      ["25%", "New-customer discount in month one"],
      ["6", "Cleaning & property services"],
      ["DE · EN", "Bilingual customer experience"],
      ["100%", "Clear agreements & transparent prices"]
    ],
    servicesEyebrow: "SERVICES",
    servicesTitle: "Cleaning that fits around your day.",
    servicesBody: "From recurring office cleaning to Airbnb turnovers: clearly defined services, direct communication and pricing you can understand before you book.",
    services: [
      ["01", "Office cleaning", "Scheduled cleaning for offices, practices and commercial spaces.", "Office & business"],
      ["02", "Home cleaning", "Reliable recurring cleaning for apartments and private homes.", "Residential"],
      ["03", "Airbnb & holiday rentals", "Fast turnovers, clean handovers and guest-ready spaces.", "Turnover"],
      ["04", "Stairwell cleaning", "Regular care for entrances, stairs and shared areas.", "Apartment buildings"],
      ["05", "Deep & end-of-tenancy", "Intensive cleaning for moves or special requirements.", "Deep cleaning"],
      ["06", "Property care", "Practical support for your property and recurring tasks.", "Property service"]
    ],
    promise: {
      eyebrow: "OUR APPROACH",
      title: "Service quality meets digital transparency.",
      body: "FrankiFlow combines personal service with practical digital tools. Pricing, scope and next steps stay clear from the beginning.",
      items: [
        ["01", "Transparent", "Calculate estimates online and understand what is included."],
        ["02", "Personal", "A direct contact instead of an anonymous service chain."],
        ["03", "Reliable", "Clear agreements, defined scope and dependable handovers."]
      ]
    },
    processEyebrow: "HOW IT WORKS",
    processTitle: "From enquiry to a clean space.",
    process: [
      ["1", "Calculate", "Choose your service, area and frequency."],
      ["2", "Confirm details", "Align access, property details and service scope."],
      ["3", "Start cleaning", "Confirm the appointment and get the job done reliably."]
    ],
    about: {
      eyebrow: "ABOUT FRANKIFLOW",
      title: "More than cleaning.",
      body1: "FrankiFlow provides professional cleaning and property care across Frankfurt am Main and the surrounding area.",
      body2: "Our goal is to combine excellent on-site work with a modern, uncomplicated customer experience — from the first estimate to recurring service.",
      quote: "Cleaning should not be a complicated process."
    },
    faqEyebrow: "FAQ",
    faqTitle: "Quick answers.",
    faq: [
      ["How much does cleaning cost?", "Pricing depends on the service, area, frequency and any extras. The price calculator gives you an instant non-binding estimate."],
      ["Can office cleaning happen outside working hours?", "Yes. We coordinate times and access around your business and the property."],
      ["Can FrankiFlow provide cleaning supplies?", "Yes. Cleaning supplies and equipment can be added when needed."],
      ["Do you offer recurring contracts?", "Yes. Recurring schedules and different contract durations are available depending on the service."]
    ],
    contact: {
      eyebrow: "READY?",
      title: "Let’s make your property clean and easy to manage.",
      body: "Start with an instant estimate or contact us directly.",
      calc: "Calculate price",
      mail: "Send an email"
    },
    footer: "Professional cleaning & property care · Frankfurt am Main & surroundings"
  }
} as const;

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default function SitePage({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const isDe = lang === "de";

  return (
    <main>
      <header className="nav-shell">
        <div className="nav-wrap">
          <a className="brand" href="#top" aria-label="FrankiFlow">
            <img src="https://frankiflow.de/assets/frankiflow-logo.png" alt="FrankiFlow" />
          </a>
          <nav className="desktop-nav" aria-label={isDe ? "Hauptnavigation" : "Main navigation"}>
            <a href="#services">{t.nav.services}</a>
            <a href="#about">{t.nav.about}</a>
            <a href="#faq">{t.nav.faq}</a>
            <a href="#contact">{t.nav.contact}</a>
          </nav>
          <div className="nav-actions">
            <div className="lang-switch" aria-label={isDe ? "Sprache" : "Language"}>
              <a className={isDe ? "active" : ""} href="/">DE</a>
              <span>·</span>
              <a className={!isDe ? "active" : ""} href="/en/">EN</a>
            </div>
            <a className="nav-cta" href="https://frankiflow.de/preisrechner/">
              {t.hero.primary} <Arrow />
            </a>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="page-wrap hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <i />
              {t.hero.kicker}
            </div>
            <h1>
              <span>{t.hero.titleA}</span>
              <em>{t.hero.titleB}</em>
            </h1>
            <p className="hero-body">{t.hero.body}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="https://frankiflow.de/preisrechner/">
                {t.hero.primary} <Arrow />
              </a>
              <a className="button button-secondary" href="#contact">
                {t.hero.secondary}
              </a>
            </div>
            <div className="trust-list">
              {t.hero.trust.map((item) => (
                <span key={item}><b>✓</b>{item}</span>
              ))}
            </div>
          </div>

          <div className="hero-stage" aria-label={t.panel.title}>
            <div className="stage-photo" />
            <div className="calculator-card">
              <div className="calculator-head">
                <span>{t.panel.eyebrow}</span>
                <i>LIVE</i>
              </div>
              <h2>{t.panel.title}</h2>
              <div className="calculator-rows">
                {t.panel.rows.map(([number, label]) => (
                  <div key={number}>
                    <b>{number}</b>
                    <span>{label}</span>
                    <em>✓</em>
                  </div>
                ))}
              </div>
              <a href="https://frankiflow.de/preisrechner/">
                {t.panel.cta} <Arrow />
              </a>
              <small>{t.panel.note}</small>
            </div>
            <div className="float-card float-discount"><strong>25%</strong><span>{isDe ? "Neukundenrabatt" : "new-customer discount"}</span></div>
            <div className="float-card float-contact"><i>●</i><div><strong>{isDe ? "Persönlich betreut" : "Personal service"}</strong><span>{isDe ? "direkter Ansprechpartner" : "direct point of contact"}</span></div></div>
          </div>
        </div>
      </section>

      <section className="signal">
        <div className="page-wrap signal-grid">
          {t.strip.map(([big, label]) => (
            <div key={big + label}>
              <strong>{big}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-light" id="services">
        <div className="page-wrap">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">{t.servicesEyebrow}</span>
              <h2>{t.servicesTitle}</h2>
            </div>
            <p>{t.servicesBody}</p>
          </div>
          <div className="service-grid">
            {t.services.map(([number, title, body, tag], index) => (
              <article className={"service-card service-" + (index + 1)} key={number}>
                <div className="service-top">
                  <span>{number}</span>
                  <b>{tag}</b>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
                <a href="https://frankiflow.de/preisrechner/">
                  {isDe ? "Preis berechnen" : "Calculate price"} <Arrow />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="page-wrap promise-grid">
          <div className="promise-copy">
            <span className="section-eyebrow on-dark">{t.promise.eyebrow}</span>
            <h2>{t.promise.title}</h2>
            <p>{t.promise.body}</p>
            <a className="text-arrow" href="#contact">{isDe ? "FrankiFlow kennenlernen" : "Get to know FrankiFlow"} <Arrow /></a>
          </div>
          <div className="promise-list">
            {t.promise.items.map(([number, title, body]) => (
              <article key={number}>
                <span>{number}</span>
                <div><h3>{title}</h3><p>{body}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="page-wrap">
          <div className="center-heading">
            <span className="section-eyebrow">{t.processEyebrow}</span>
            <h2>{t.processTitle}</h2>
          </div>
          <div className="process-grid">
            {t.process.map(([number, title, body]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-light" id="about">
        <div className="page-wrap about-grid">
          <div className="about-visual">
            <div className="about-image" />
            <div className="about-badge"><strong>FF</strong><span>{isDe ? "Frankfurt am Main" : "Frankfurt, Germany"}</span></div>
          </div>
          <div className="about-copy">
            <span className="section-eyebrow">{t.about.eyebrow}</span>
            <h2>{t.about.title}</h2>
            <p>{t.about.body1}</p>
            <p>{t.about.body2}</p>
            <blockquote>“{t.about.quote}”</blockquote>
          </div>
        </div>
      </section>

      <section className="section section-soft" id="faq">
        <div className="page-wrap faq-grid">
          <div className="faq-heading">
            <span className="section-eyebrow">{t.faqEyebrow}</span>
            <h2>{t.faqTitle}</h2>
          </div>
          <div className="faq-list">
            {t.faq.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}<span>+</span></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="page-wrap contact-card">
          <div>
            <span>{t.contact.eyebrow}</span>
            <h2>{t.contact.title}</h2>
            <p>{t.contact.body}</p>
          </div>
          <div className="contact-actions">
            <a className="button button-white" href="https://frankiflow.de/preisrechner/">{t.contact.calc} <Arrow /></a>
            <a className="button button-outline-light" href="mailto:info@frankiflow.de">{t.contact.mail}</a>
          </div>
          <div className="contact-meta">
            <a href="tel:+4917662493041">+49 176 62493041</a>
            <a href="mailto:info@frankiflow.de">info@frankiflow.de</a>
            <a href="https://wa.link/9knp7y">WhatsApp</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="page-wrap footer-grid">
          <div className="footer-brand">
            <img src="https://frankiflow.de/assets/frankiflow-logo.png" alt="FrankiFlow" />
            <p>{t.footer}</p>
          </div>
          <div className="footer-links">
            <a href="#services">{t.nav.services}</a>
            <a href="#about">{t.nav.about}</a>
            <a href="#faq">{t.nav.faq}</a>
            <a href="https://frankiflow.de/impressum/">{isDe ? "Impressum" : "Legal notice"}</a>
            <a href="https://frankiflow.de/datenschutz/">{isDe ? "Datenschutz" : "Privacy"}</a>
          </div>
          <div className="footer-products">
            <a href="https://calcpura.frankiflow.de/">CalcPura <Arrow /></a>
            <a href="https://stay.frankiflow.de/">FrankiHolz <Arrow /></a>
          </div>
        </div>
        <div className="page-wrap footer-bottom">
          <span>© 2026 FrankiFlow</span>
          <span>Next.js design preview · develop branch</span>
        </div>
      </footer>
    </main>
  );
}
