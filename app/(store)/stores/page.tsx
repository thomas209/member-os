import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";

// Se regenera una vez por día para que las fechas de temporada del schema estén al día.
export const revalidate = 86400;

const STORE = {
  name: "Member Club",
  address: "Av. Constitución 270, B7167 Pinamar, Provincia de Buenos Aires",
  phone: "011 15-3086-6758",
  phoneHref: "+541530866758",
  hours: "Todos los días, 10:00 a 22:30",
  mapsQuery: "Av. Constitución 270, Pinamar, Buenos Aires",
};

// Solo para Google/IAs (datos estructurados), no se muestra en la página.
const BRANDS = [
  "Nike",
  "Adidas",
  "On Running",
  "Hoka",
  "Onitsuka Tiger",
  "Birkenstock",
  "Supreme",
  "Kith",
  "Stussy",
  "Alo",
  "Longchamp",
];

// Temporada vigente o próxima: 15/12 al 31/03, todos los días 10 a 22:30.
// Resto del año: viernes a domingo, 10 a 20.
function seasonDates(now = new Date()) {
  const y = now.getFullYear();
  const startYear = now.getMonth() < 3 ? y - 1 : y;
  return { validFrom: `${startYear}-12-15`, validThrough: `${startYear + 1}-03-31` };
}

export const metadata: Metadata = {
  title: "Ropa y zapatillas importadas en Pinamar",
  description:
    "Member Club: ropa y zapatillas importadas en Pinamar. Nike, Adidas, On Running, Hoka, Supreme, Kith y más. Local en Av. Constitución 270.",
  alternates: { canonical: `${SITE_URL}/stores` },
  openGraph: {
    title: "Ropa y zapatillas importadas en Pinamar | Member Club",
    description: "Zapatillas e indumentaria importada en Pinamar. Av. Constitución 270.",
    url: `${SITE_URL}/stores`,
    siteName: "Member Club",
    type: "website",
  },
};

export default function StoresPage() {
  const mapsEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(STORE.mapsQuery)}&output=embed`;
  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(STORE.mapsQuery)}`;

  const season = seasonDates();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": `${SITE_URL}/stores#store`,
    name: STORE.name,
    description:
      "Tienda de ropa y zapatillas importadas en Pinamar. Streetwear, sneakers y accesorios de marcas internacionales. Envíos a todo el país y encargos de productos fuera de stock.",
    image: "https://res.cloudinary.com/dklvmlzds/image/upload/v1783912898/MEMBER_B_1_3_wyfasx.png",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. Constitución 270",
      addressLocality: "Pinamar",
      addressRegion: "Buenos Aires",
      postalCode: "B7167",
      addressCountry: "AR",
    },
    areaServed: ["Pinamar", "Cariló", "Valeria del Mar", "Ostende", "Argentina"],
    telephone: STORE.phone,
    url: SITE_URL,
    hasMap: `https://www.google.com/maps?q=${encodeURIComponent(STORE.mapsQuery)}`,
    sameAs: ["https://instagram.com/member_ba"],
    brand: BRANDS.map((name) => ({ "@type": "Brand", name })),
    paymentAccepted: "Mercado Pago, tarjeta de crédito, tarjeta de débito, transferencia",
    currenciesAccepted: "ARS",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Friday", "Saturday", "Sunday"],
        opens: "10:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "10:00",
        closes: "22:30",
        validFrom: season.validFrom,
        validThrough: season.validThrough,
      },
    ],
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
