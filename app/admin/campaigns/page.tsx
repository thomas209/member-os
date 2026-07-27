import { prisma } from "@/lib/prisma";
import CampaignComposer from "./CampaignComposer";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const customers = await prisma.customer.findMany({
    where: { email: { not: "" } },
    select: { id: true, firstName: true, lastName: true, email: true, tags: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  const recipientCount = customers.length;

  return (
    <div style={{ padding: "48px", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "4px" }}>Campañas</h1>
        <p style={{ fontSize: "13px", color: "#737373" }}>
          Mandá una oferta por mail a toda la base o a una selección de clientes.
        </p>
      </div>
      <CampaignComposer recipientCount={recipientCount} customers={customers} />
    </div>
  );
}
