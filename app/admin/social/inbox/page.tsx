import { isSocialEnabled } from "@/lib/ai/config";
import InboxView from "./InboxView";

export const dynamic = "force-dynamic";

export default function InboxPage() {
  if (!isSocialEnabled()) {
    return (
      <div style={{ padding: "48px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Inbox</h1>
        <p style={{ fontSize: "13px", color: "#737373" }}>El módulo está apagado (FEATURE_SOCIAL).</p>
      </div>
    );
  }
  return <InboxView />;
}
