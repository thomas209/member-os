import { prisma } from "@/lib/prisma";
import CampaignComposer from "./CampaignComposer";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const recipientCount = await prisma.customer.count({ where: { email: { not: "" } } });

  return (
    <div style={{ padding: "48px", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "4px" }}>Campañas</h1>
        <p style={{ fontSize: "13px", color: "#737373" }}>
          Mandá una oferta por mail a los {recipientCount} clientes registrados con email cargado.
        </p>
      </div>
      <CampaignComposer recipientCount={recipientCount} />
    </div>
  );
}
