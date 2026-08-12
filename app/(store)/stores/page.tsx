import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";

const STORE = {
  name: "Member Club",
  address: "Av. Constitución 270, B7167 Pinamar, Provincia de Buenos Aires",
  phone: "011 15-3086-6758",
  phoneHref: "+541530866758",
  hours: "Todos los días, 10:00 a 22:30",
  mapsQuery: "Av. Constitución 270, Pinamar, Buenos Aires",
};

export const metadata: Metadata = {
  title: "Nuestro local en Pinamar | Member Club",
  description:
    "Visitá Member Club en Av. Constitución 270, Pinamar. Ropa y zapatillas premium: Nike, Adidas, Onitsuka, Stussy y más marcas.",
  alternates: { canonical: `${SITE_URL}/stores` },
  openGraph: {
    title: "Nuestro local en Pinamar | Member Club",
    description: "Ropa y zapatillas premium en Pinamar. Av. Constitución 270.",
    url: `${SITE_URL}/stores`,
    siteName: "Member Club",
    type: "website",
  },
};

export default function StoresPage() {
  const mapsEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(STORE.mapsQuery)}&output=embed`;
  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(STORE.mapsQuery)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: STORE.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. Constitución 270",
      addressLocality: "Pinamar",
      addressRegion: "Buenos Aires",
      postalCode: "B7167",
      addressCountry: "AR",
    },
    telephone: STORE.phone,
    url: `${SITE_URL}/stores`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-[1440px] mx-auto px-4 py-6 md:px-12 md:py-12">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-8">
          Nuestro local
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-20">
          <div className="w-full aspect-square md:aspect-[4/3] overflow-hidden rounded-lg border border-neutral-100">
            <iframe
              src={mapsEmbedSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Ubicación de ${STORE.name} en Pinamar`}
            />
          </div>

          <div className="pt-0 md:pt-2">
            <p className="text-[11px] tracking-widest uppercase text-neutral-400 mb-3">
              Pinamar
            </p>
            <h2 className="text-xl md:text-2xl font-bold mb-6">{STORE.name}</h2>

            <div className="space-y-5 text-sm text-neutral-600 mb-8">
              <div>
                <p className="font-semibold text-[#0A0A0A] mb-1">Dirección</p>
                <p>{STORE.address}</p>
              </div>
              <div>
                <p className="font-semibold text-[#0A0A0A] mb-1">Horario</p>
                <p>{STORE.hours}</p>
              </div>
              <div>
                <p className="font-semibold text-[#0A0A0A] mb-1">Teléfono</p>
                <a href={`tel:${STORE.phoneHref}`} className="hover:underline">
                  {STORE.phone}
                </a>
              </div>
            </div>

            <a
              href={mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#0A0A0A] text-white text-sm font-semibold uppercase tracking-wide rounded-md hover:bg-neutral-800 transition-colors"
            >
              Cómo llegar
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
