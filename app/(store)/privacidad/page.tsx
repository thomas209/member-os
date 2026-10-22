import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo Member Club usa y protege los datos de sus clientes.",
  alternates: { canonical: `${SITE_URL}/privacidad` },
};

const UPDATED = "22 de octubre de 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-[#0A0A0A] mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacidadPage() {
  return (
    <div className="max-w-[760px] mx-auto px-4 py-6 md:px-12 md:py-12">
      <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">Política de privacidad</h1>
      <p className="text-xs text-neutral-400 mb-10">Última actualización: {UPDATED}</p>

      <div className="text-sm text-neutral-600 leading-relaxed">
        <Section title="Quiénes somos">
          <p>
            Member Club es una tienda de ropa y zapatillas con local en Av. Constitución 270, Pinamar,
            Provincia de Buenos Aires, Argentina, y tienda online en memberclubargentina.com.
          </p>
        </Section>

        <Section title="Qué datos usamos">
          <p>
            Nombre, email, teléfono, dirección de envío y los datos de tus pedidos cuando comprás o creás
            una cuenta. Los pagos se procesan en Mercado Pago: no guardamos datos de tarjetas.
          </p>
          <p>
            Si nos escribís por Instagram o WhatsApp, guardamos tu nombre de usuario o número y los mensajes
            de la conversación para poder responderte desde nuestro panel.
          </p>
        </Section>

        <Section title="Para qué los usamos">
          <p>
            Para procesar y enviar tus pedidos, avisarte el estado de tu compra, responder tus consultas y,
            si lo aceptás, enviarte novedades. Usamos herramientas de inteligencia artificial para sugerir
            respuestas a los mensajes; siempre las revisa una persona del equipo.
          </p>
          <p>No vendemos ni compartimos tus datos con terceros para publicidad.</p>
        </Section>

        <Section title="Con quién se comparten">
          <p>
            Solo con los servicios necesarios para operar: Mercado Pago (pagos), empresas de envío como
            Andreani (entregas), Meta (Instagram y WhatsApp, para recibir y responder mensajes) y nuestros
            proveedores de hosting y email.
          </p>
        </Section>

        <Section title="Cuánto tiempo los guardamos">
          <p>
            Mientras tengas una cuenta o mientras sea necesario por obligaciones legales y contables. Los
            mensajes se guardan mientras la conversación esté activa o hasta que pidas borrarlos.
          </p>
        </Section>

        <Section title="Tus derechos y cómo borrar tus datos">
          <p>
            Podés pedir ver, corregir o eliminar tus datos en cualquier momento, incluidos los mensajes de
            Instagram o WhatsApp. Escribinos por Instagram a{" "}
            <a href="https://instagram.com/member_ba" className="underline" target="_blank" rel="noopener noreferrer">
              @member_ba
            </a>{" "}
            o por WhatsApp al{" "}
            <a href="https://wa.me/541530866758" className="underline" target="_blank" rel="noopener noreferrer">
              011 15-3086-6758
            </a>{" "}
            con el asunto “Borrar mis datos” y lo resolvemos en un plazo máximo de 10 días hábiles.
          </p>
          <p>
            Conforme a la Ley 25.326 de Protección de Datos Personales, la Agencia de Acceso a la
            Información Pública es el órgano de control y atiende denuncias y reclamos.
          </p>
        </Section>

        <Section title="Cambios">
          <p>Si cambiamos esta política, actualizamos esta página y la fecha de arriba.</p>
        </Section>
      </div>
    </div>
  );
}
