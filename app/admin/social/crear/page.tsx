import { isSocialEnabled, aiConfig } from "@/lib/ai/config";
import { getBrandVoice } from "@/lib/ai/brandVoice";
import { spentThisMonthUsd } from "@/lib/ai/client";
import { getInstagramAccount } from "@/lib/social/instagram";
import { getCanvaAccount } from "@/lib/social/canva";
import { prisma } from "@/lib/prisma";
import SocialStudio from "../SocialStudio";
import AnnouncementStudio from "../AnnouncementStudio";

export const dynamic = "force-dynamic";

export default async function CrearPage({ searchParams }: { searchParams: Promise<{ canva?: string }> }) {
  const { canva: canvaStatus } = await searchParams;
  if (!isSocialEnabled()) {
    return (
      <div style={{ padding: "48px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Redes</h1>
        <p style={{ fontSize: "13px", color: "#737373" }}>El módulo está apagado (FEATURE_SOCIAL).</p>
      </div>
    );
  }

  const [voice, spent, account, canvaAccount, templates] = await Promise.all([
    getBrandVoice(),
    spentThisMonthUsd(),
    getInstagramAccount(),
    getCanvaAccount(),
    prisma.socialTemplate.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div style={{ padding: "48px", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "4px" }}>Crear a mano</h1>
        <p style={{ fontSize: "13px", color: "#737373" }}>
          Modo avanzado. Voz de la marca y captions sugeridos por IA. Nada se publica sin tu aprobación.
        </p>
        <p style={{ fontSize: "12px", color: "#A3A3A3", marginTop: "8px" }}>
          Gasto de IA este mes: USD {spent.toFixed(2)} de {aiConfig.monthlyBudgetUsd} · modelo {aiConfig.model}
        </p>
      </div>
      <SocialStudio
        canvaStatus={canvaStatus ?? null}
        initialCanva={!!canvaAccount}
        initialTemplates={templates.map((t) => ({ id: t.id, name: t.name, canvaDesignId: t.canvaDesignId, dataset: t.dataset as Record<string, { type: string }> }))}
        initialAccount={
          account
            ? { handle: account.handle, picture: account.profilePictureUrl, status: account.status, tokenExpiresAt: account.tokenExpiresAt?.toISOString() ?? null }
            : null
        }
        initialVoice={
          voice
            ? { tone: voice.tone, doWords: voice.doWords, dontWords: voice.dontWords, examples: voice.examples }
            : null
        }
      />
      <AnnouncementStudio
        account={account ? { handle: account.handle, picture: account.profilePictureUrl, status: account.status } : null}
      />
    </div>
  );
}
