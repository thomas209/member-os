// Datos compartidos para SEO (Google) y para cuando se comparte un link
// (WhatsApp, Instagram, Facebook). Un solo lugar para no repetirlos.
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";

export const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";

// Imagen por defecto al compartir un link (1200x630). Los productos usan su propia foto.
export const OG_IMAGE = {
  url: "/og-member-club.png",
  width: 1200,
  height: 630,
  alt: "Member Club · Ropa y zapatillas importadas en Pinamar",
};

export const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Member Club",
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  image: `${SITE_URL}${OG_IMAGE.url}`,
  description: "Ropa y zapatillas importadas en Pinamar. Nike, Adidas, On Running, Hoka, Supreme y más. Envíos a todo el país.",
  telephone: "+54 9 11 3086-6758",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Av. Constitución 270",
    addressLocality: "Pinamar",
    postalCode: "B7167",
    addressRegion: "Buenos Aires",
    addressCountry: "AR",
  },
  sameAs: ["https://instagram.com/member_ba"],
};

export const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Member Club",
  url: SITE_URL,
  inLanguage: "es-AR",
  publisher: { "@id": `${SITE_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/catalog?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

// Envio y devoluciones para la ficha de producto (Google los muestra en el resultado).
// Envio: $18.000, gratis desde $180.000 (lib/shipping). Devolucion: 10 dias,
// sin uso y con etiqueta, el envio lo paga el cliente.
export function offerExtras(price: number) {
  return {
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: price >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST,
        currency: "ARS",
      },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "AR" },
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "AR",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 10,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}
