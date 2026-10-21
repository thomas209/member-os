import { isSocialEnabled } from "@/lib/ai/config";
import ReferenceStudio from "./ReferenceStudio";

export const dynamic = "force-dynamic";

export default function ReferenciaPage() {
  if (!isSocialEnabled()) {
    return <div style={{ padding: "48px" }}><p style={{ fontSize: "13px", color: "#737373" }}>El módulo está apagado (FEATURE_SOCIAL).</p></div>;
  }
  return <ReferenceStudio />;
}
