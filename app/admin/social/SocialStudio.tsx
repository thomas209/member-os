"use client";
import { useEffect, useState } from "react";
import InstagramPreview from "./InstagramPreview";
import StoryPreview from "./StoryPreview";
import PublishActions from "./PublishActions";

type Voice = { tone: string; doWords: string[]; dontWords: string[]; examples: string[] };
type Account = { handle: string | null; picture: string | null; status: string; tokenExpiresAt: string | null };
type Proposal = {
  tone: string; doWords: string[]; dontWords: string[]; examples: string[];
  insights: { resumen: string; estiloVisual: string; hashtagsFrecuentes: string[]; queRindeMas: string[]; queRindeMenos: string[]; recomendaciones: string[] };
};
type Template = { id: string; name: string; canvaDesignId: string; dataset: Record<string, { type: string }> };
type CanvaResult = { generationId: string | null; caption: string | null; images: string[]; editUrls: string[] };
type Product = { id: string; name: string; brand: string; image: string | null; imageCount: number; sizes: string[] };
const TAGS = ["", "NEW IN", "RESTOCK", "ULTIMOS TALLES", "SALE"];

const card: React.CSSProperties = { border: "1px solid #E5E5E5", borderRadius: "12px", padding: "24px", marginBottom: "24px", background: "white" };
const label: React.CSSProperties = { display: "block", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373", marginBottom: "6px" };
const input: React.CSSProperties = { width: "100%", border: "1px solid #E5E5E5", borderRadius: "8px", padding: "10px 12px", fontSize: "14px", fontFamily: "inherit", marginBottom: "16px" };
const btn: React.CSSProperties = { background: "#0A0A0A", color: "white", border: "none", borderRadius: "8px", padding: "10px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { ...btn, background: "white", color: "#0A0A0A", border: "1px solid #E5E5E5" };

const toList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function SocialStudio({
  initialVoice,
  initialAccount,
  initialCanva,
  initialTemplates,
  canvaStatus,
}: {
  initialVoice: Voice | null;
  initialAccount: Account | null;
  initialCanva: boolean;
  initialTemplates: Template[];
  canvaStatus: string | null;
}) {
  // ---- Canva ----
  const [canvaConnected, setCanvaConnected] = useState(initialCanva);
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [tplUrl, setTplUrl] = useState("");
  const [tplName, setTplName] = useState("");
  const [canvaMsg, setCanvaMsg] = useState(
    canvaStatus === "ok" ? "Canva conectado ✓" : canvaStatus === "error" ? "No se pudo conectar Canva. Proba de nuevo." : ""
  );
  const [templateId, setTemplateId] = useState(initialTemplates[0]?.id || "");
  const [canvaLoading, setCanvaLoading] = useState(false);
  const [canvaResult, setCanvaResult] = useState<CanvaResult | null>(null);

  async function addTemplate() {
    setCanvaMsg("Leyendo la plantilla…");
    const res = await fetch("/api/admin/social/templates", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: tplUrl, name: tplName }),
    });
    const data = await res.json();
    if (!res.ok) return setCanvaMsg(data.error || "No se pudo agregar");
    setTemplates((t) => [data.template, ...t.filter((x) => x.id !== data.template.id)]);
    setTemplateId(data.template.id);
    setTplUrl("");
    setTplName("");
    setCanvaMsg("Plantilla agregada ✓");
  }

  async function removeTemplate(id: string) {
    await fetch("/api/admin/social/templates/" + id, { method: "DELETE" });
    setTemplates((t) => t.filter((x) => x.id !== id));
    if (templateId === id) setTemplateId("");
  }

  async function disconnectCanva() {
    await fetch("/api/admin/social/canva", { method: "DELETE" });
    setCanvaConnected(false);
    setCanvaMsg("Canva desconectado");
  }

  // ---- Instagram ----
  const [account, setAccount] = useState<Account | null>(initialAccount);
  const [igToken, setIgToken] = useState("");
  const [igMsg, setIgMsg] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [pendingInsights, setPendingInsights] = useState<Proposal["insights"] | null>(null);

  async function connectIg() {
    setIgMsg("Conectando…");
    const res = await fetch("/api/admin/social/account", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: igToken }),
    });
    const data = await res.json();
    if (!res.ok) return setIgMsg(data.error || "No se pudo conectar");
    setAccount(data.account);
    setIgToken("");
    setIgMsg("Conectada ✓");
  }

  async function disconnectIg() {
    await fetch("/api/admin/social/account", { method: "DELETE" });
    setAccount(null);
    setProposal(null);
    setIgMsg("Desconectada");
  }

  async function analyze() {
    setAnalyzing(true);
    setIgMsg("");
    try {
      const res = await fetch("/api/admin/social/analyze", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setProposal(data.proposal);
      setIgMsg(`Analizados ${data.postsAnalyzed} posts`);
    } catch (e) {
      setIgMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setAnalyzing(false);
    }
  }

  function useProposal() {
    if (!proposal) return;
    setTone(proposal.tone);
    setDoWords(proposal.doWords.join(", "));
    setDontWords(proposal.dontWords.join(", "));
    setExamples(proposal.examples.join("\n\n---\n\n"));
    setPendingInsights(proposal.insights);
    setVoiceMsg("Propuesta cargada. Revisala y tocá Guardar voz.");
  }

  // ---- Voz de la marca ----
  const [tone, setTone] = useState(initialVoice?.tone || "");
  const [doWords, setDoWords] = useState((initialVoice?.doWords || []).join(", "));
  const [dontWords, setDontWords] = useState((initialVoice?.dontWords || []).join(", "));
  const [examples, setExamples] = useState((initialVoice?.examples || []).join("\n\n---\n\n"));
  const [voiceMsg, setVoiceMsg] = useState("");

  async function saveVoice() {
    setVoiceMsg("Guardando…");
    const res = await fetch("/api/admin/social/brand-voice", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tone,
        doWords: toList(doWords),
        dontWords: toList(dontWords),
        examples: examples.split(/\n\s*---\s*\n/).map((x) => x.trim()).filter(Boolean),
        ...(pendingInsights ? { insights: pendingInsights } : {}),
      }),
    });
    if (res.ok) setPendingInsights(null);
    setVoiceMsg(res.ok ? "Guardado ✓" : "No se pudo guardar");
  }

  // ---- Productos ----
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product[]>([]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch("/api/admin/social/products?q=" + encodeURIComponent(q));
      if (res.ok) setResults((await res.json()).products);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const toggle = (p: Product) =>
    setSelected((s) => (s.some((x) => x.id === p.id) ? s.filter((x) => x.id !== p.id) : s.length >= 10 ? s : [...s, p]));

  // ---- Imagenes del post (fotos reales + logo real, sin IA) ----
  const [slides, setSlides] = useState<Record<string, { photo: number; tag: string }>>({});
  const [savingImgs, setSavingImgs] = useState(false);
  const [savedUrls, setSavedUrls] = useState<string[]>([]);
  const [format, setFormat] = useState<"post" | "story">("post");
  const isStory = format === "story";
  const slide = (id: string) => slides[id] || { photo: 0, tag: "" };
  const setSlide = (id: string, patch: Partial<{ photo: number; tag: string }>) =>
    setSlides((s) => ({ ...s, [id]: { ...slide(id), ...patch } }));
  const previewUrl = (id: string) => {
    const sl = slide(id);
    return `/api/admin/social/post-image?productId=${id}&photo=${sl.photo}&format=${format}${sl.tag ? "&tag=" + encodeURIComponent(sl.tag) : ""}`;
  };

  const [advice, setAdvice] = useState<{ reason: string; references: { permalink: string; why: string }[] } | null>(null);
  const [advising, setAdvising] = useState(false);
  const [useCanva, setUseCanva] = useState(false);

  async function recommend() {
    setAdvising(true);
    setError("");
    try {
      const res = await fetch("/api/admin/social/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productIds: selected.map((p) => p.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      const next: Record<string, { photo: number; tag: string }> = {};
      for (const sl of data.slides) next[sl.productId] = { photo: sl.photo, tag: sl.tag || "" };
      setSlides((s) => ({ ...s, ...next }));
      if (data.templateId) {
        setTemplateId(data.templateId);
        setUseCanva(true);
      } else setUseCanva(false);
      setAdvice({ reason: data.reason, references: data.references });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setAdvising(false);
    }
  }

  async function saveImages() {
    setSavingImgs(true);
    setError("");
    try {
      const res = await fetch("/api/admin/social/post-image/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format, slides: selected.map((p) => ({ productId: p.id, ...slide(p.id) })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setSavedUrls(data.urls);
      return data.urls as string[];
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      return null;
    } finally {
      setSavingImgs(false);
    }
  }

  // ---- Vista previa en Instagram + OK para publicar ----
  const [preview, setPreview] = useState<{ postId: string; images: string[] } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  async function openPreview() {
    setError("");
    setPublishedUrl(null);
    setConfirming(false);
    const imgs = !isStory && canvaResult?.images?.length ? canvaResult.images : savedUrls.length ? savedUrls : await saveImages();
    if (!imgs || !imgs.length) return;
    if (!isStory && !caption.trim()) return setError("Generá o escribí el texto del post primero");
    // Si ya hay un borrador de esta vista previa (sin publicar), se actualiza en vez de crear otro.
    if (preview?.postId && !publishedUrl) {
      const u = await fetch(`/api/admin/social/posts/${preview.postId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caption, mediaUrls: imgs }),
      });
      if (u.ok) return setPreview({ postId: preview.postId, images: imgs });
    }
    const res = await fetch("/api/admin/social/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: format, productIds: selected.map((p) => p.id), mediaUrls: imgs, caption }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Error");
    setPreview({ postId: data.post.id, images: imgs });
  }

  async function publish() {
    if (!preview) return;
    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/social/posts/${preview.postId}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setPublishedUrl(data.post.permalink || "publicado");
      if (genId) await mark("accept");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setPublishing(false);
      setConfirming(false);
    }
  }

  // ---- Caption ----
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [genId, setGenId] = useState<string | null>(null);
  const [original, setOriginal] = useState("");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch("/api/admin/social/caption", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productIds: selected.map((p) => p.id), note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setGenId(data.generationId);
      setOriginal(data.text);
      setCaption(data.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function generateWithCanva() {
    setCanvaLoading(true);
    setError("");
    setCanvaResult(null);
    try {
      const res = await fetch("/api/admin/social/canva-post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slides: selected.map((p) => ({ productId: p.id, ...slide(p.id) })), templateId, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setCanvaResult(data);
      if (data.caption) {
        setGenId(data.generationId);
        setOriginal(data.caption);
        setCaption(data.caption);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setCanvaLoading(false);
    }
  }

  async function mark(kind: "accept" | "discard") {
    if (!genId) return;
    const s = kind === "discard" ? "discarded" : caption.trim() === original.trim() ? "accepted" : "edited";
    await fetch("/api/admin/social/generations/" + genId, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    if (kind === "accept") {
      await navigator.clipboard?.writeText(caption).catch(() => {});
      setStatus(s === "edited" ? "Guardado como editado y copiado ✓" : "Aceptado y copiado ✓");
    } else {
      setStatus("Descartado");
      setCaption("");
      setGenId(null);
    }
  }

  return (
    <div>
      <section style={card}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Instagram</h2>
        {account ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              {account.picture && <img src={account.picture} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />}
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>@{account.handle}</div>
                <div style={{ fontSize: "12px", color: account.status === "active" ? "#16A34A" : "#DC2626" }}>
                  {account.status === "active" ? "Conectada" : "Hay que reconectar"}
                  {account.tokenExpiresAt && ` · token vence el ${new Date(account.tokenExpiresAt).toLocaleDateString("es-AR")}`}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button style={{ ...btn, opacity: analyzing ? 0.4 : 1 }} disabled={analyzing} onClick={analyze}>
                {analyzing ? "Analizando posts… (1-2 min)" : "Analizar mi perfil"}
              </button>
              <button style={btnGhost} onClick={disconnectIg}>Desconectar</button>
              <span style={{ fontSize: "13px", color: "#737373" }}>{igMsg}</span>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: "13px", color: "#737373", marginBottom: "16px" }}>
              Pegá el token de la cuenta de Instagram de prueba (Meta for Developers → tu app → Instagram → Generar token).
              Se guarda cifrado y no se vuelve a mostrar.
            </p>
            <input type="password" autoComplete="off" style={input} value={igToken} onChange={(e) => setIgToken(e.target.value)} placeholder="Token de acceso de Instagram" />
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button style={btn} onClick={connectIg} disabled={!igToken}>Conectar</button>
              <span style={{ fontSize: "13px", color: "#737373" }}>{igMsg}</span>
            </div>
          </>
        )}

        {proposal && (
          <div style={{ marginTop: "24px", borderTop: "1px solid #E5E5E5", paddingTop: "20px", fontSize: "13px", lineHeight: 1.6 }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Lo que encontró la IA</h3>
            <p style={{ marginBottom: "12px" }}>{proposal.insights.resumen}</p>
            <p style={{ marginBottom: "12px" }}><b>Estilo visual:</b> {proposal.insights.estiloVisual}</p>
            {[["Lo que más rinde", proposal.insights.queRindeMas], ["Lo que menos rinde", proposal.insights.queRindeMenos], ["Recomendaciones", proposal.insights.recomendaciones]].map(([t, items]) => (
              <div key={t as string} style={{ marginBottom: "12px" }}>
                <b>{t as string}</b>
                <ul style={{ paddingLeft: "18px", marginTop: "4px" }}>{(items as string[]).map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            ))}
            <p style={{ marginBottom: "16px", color: "#737373" }}>Hashtags frecuentes: {proposal.insights.hashtagsFrecuentes.join(" ")}</p>
            <button style={btn} onClick={useProposal}>Usar esta propuesta como voz de la marca</button>
          </div>
        )}
      </section>

      <section style={card}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Canva</h2>
        {!canvaConnected ? (
          <>
            <p style={{ fontSize: "13px", color: "#737373", marginBottom: "16px" }}>
              Conectá tu cuenta de Canva para que los posts salgan con imagen armada en tus plantillas.
            </p>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <a href="/api/admin/social/canva/connect" style={{ ...btn, textDecoration: "none" }}>Conectar Canva</a>
              <span style={{ fontSize: "13px", color: "#737373" }}>{canvaMsg}</span>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: "13px", color: "#16A34A", marginBottom: "16px" }}>Conectado ✓</p>
            <label style={label}>Plantillas</label>
            {templates.length === 0 && <p style={{ fontSize: "13px", color: "#737373", marginBottom: "12px" }}>Todavía no agregaste plantillas.</p>}
            {templates.map((t) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", padding: "8px 0", borderBottom: "1px solid #F5F5F5" }}>
                <span><b>{t.name}</b> · campos: {Object.entries(t.dataset).map(([k, v]) => `${k} (${v.type === "image" ? "foto" : "texto"})`).join(", ")}</span>
                <button style={{ ...btnGhost, padding: "6px 10px" }} onClick={() => removeTemplate(t.id)}>Quitar</button>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 200px auto", gap: "8px", marginTop: "16px", alignItems: "start" }}>
              <input style={input} value={tplUrl} onChange={(e) => setTplUrl(e.target.value)} placeholder="Link del diseño en Canva (con campos de Data autofill)" />
              <input style={input} value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Nombre (ej: Producto)" />
              <button style={btn} onClick={addTemplate} disabled={!tplUrl}>Agregar</button>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button style={btnGhost} onClick={disconnectCanva}>Desconectar Canva</button>
              <span style={{ fontSize: "13px", color: "#737373" }}>{canvaMsg}</span>
            </div>
          </>
        )}
      </section>

      <section style={card}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Voz de la marca</h2>
        <p style={{ fontSize: "13px", color: "#737373", marginBottom: "20px" }}>
          Así escribe la IA. Podés completarla a mano o usar la propuesta del análisis de Instagram.
        </p>
        <label style={label}>Tono</label>
        <textarea style={{ ...input, minHeight: "80px" }} value={tone} onChange={(e) => setTone(e.target.value)}
          placeholder="Ej: cercano, canchero, corto. Nada de signos de exclamación de más." />
        <label style={label}>Palabras que sí (separadas por coma)</label>
        <input style={input} value={doWords} onChange={(e) => setDoWords(e.target.value)} placeholder="drop, restock, Pinamar" />
        <label style={label}>Palabras que no (separadas por coma)</label>
        <input style={input} value={dontWords} onChange={(e) => setDontWords(e.target.value)} placeholder="increíble, oferta imperdible" />
        <label style={label}>Ejemplos de captions reales (separalos con una línea con ---)</label>
        <textarea style={{ ...input, minHeight: "140px" }} value={examples} onChange={(e) => setExamples(e.target.value)} />
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button style={btn} onClick={saveVoice}>Guardar voz</button>
          <span style={{ fontSize: "13px", color: "#737373" }}>{voiceMsg}</span>
        </div>
      </section>

      <section style={card}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Armar post</h2>
        <p style={{ fontSize: "13px", color: "#737373", marginBottom: "20px" }}>
          Elegí uno o más productos (más de uno = carrusel). La imagen se arma con tus fotos de Cloudinary y tu logo; la IA solo escribe el texto con datos reales.
        </p>
        <input style={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto o marca…" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px", marginBottom: "16px", maxHeight: "360px", overflowY: "auto" }}>
          {results.map((p) => {
            const on = selected.some((x) => x.id === p.id);
            return (
              <button key={p.id} onClick={() => toggle(p)}
                style={{ textAlign: "left", border: on ? "2px solid #0A0A0A" : "1px solid #E5E5E5", borderRadius: "10px", padding: "8px", background: "white", cursor: "pointer" }}>
                {p.image && <img src={p.image} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "6px", marginBottom: "6px" }} />}
                <div style={{ fontSize: "11px", color: "#737373" }}>{p.brand}</div>
                <div style={{ fontSize: "12px", fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: "11px", color: p.sizes.length ? "#16A34A" : "#DC2626" }}>
                  {p.sizes.length ? p.sizes.join(" · ") : "Sin stock"}
                </div>
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
              {(["post", "story"] as const).map((f) => (
                <button key={f} style={format === f ? btn : btnGhost} onClick={() => { setFormat(f); setSavedUrls([]); setPreview(null); }}>
                  {f === "post" ? "Publicación (4:5)" : "Historia (9:16)"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
              <button style={{ ...btn, opacity: advising ? 0.4 : 1 }} disabled={advising} onClick={recommend}>
                {advising ? "Mirando tus mejores posts…" : "✨ Recomendar diseño"}
              </button>
              <span style={{ fontSize: "12px", color: "#737373" }}>Mira tus posts que mejor funcionaron y elige diseño, foto y etiqueta.</span>
            </div>
            {advice && (
              <div style={{ background: "#FAFAFA", border: "1px solid #E5E5E5", borderRadius: "8px", padding: "12px 14px", fontSize: "13px", lineHeight: 1.5, marginBottom: "16px" }}>
                <b>Recomendación{useCanva ? ` · plantilla "${templates.find((t) => t.id === templateId)?.name || ""}"` : " · diseño propio de Member OS"}:</b> {advice.reason}
                {advice.references.length > 0 && (
                  <ul style={{ paddingLeft: "18px", marginTop: "6px" }}>
                    {advice.references.map((r) => (
                      <li key={r.permalink}><a href={r.permalink} target="_blank" rel="noreferrer">Ver post de referencia</a> — {r.why}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <label style={label}>
              {isStory ? `Historia${selected.length > 1 ? `s (${selected.length}, una por producto)` : ""}` : `Imágenes del post (${selected.length === 1 ? "foto" : `carrusel de ${selected.length}`})`} · tus fotos y tu logo, sin nada inventado
            </label>
            <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "8px" }}>
              {selected.map((p) => {
                const sl = slide(p.id);
                return (
                  <div key={p.id} style={{ flex: "0 0 240px" }}>
                    <img src={previewUrl(p.id)} alt="" style={{ width: "240px", aspectRatio: isStory ? "9 / 16" : "4 / 5", borderRadius: "8px", border: "1px solid #E5E5E5", background: "#FAFAFA" }} />
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "8px" }}>
                      <button style={{ ...btnGhost, padding: "4px 10px" }} disabled={sl.photo <= 0} onClick={() => setSlide(p.id, { photo: sl.photo - 1 })}>←</button>
                      <span style={{ fontSize: "12px", color: "#737373" }}>foto {sl.photo + 1}/{Math.max(p.imageCount, 1)}</span>
                      <button style={{ ...btnGhost, padding: "4px 10px" }} disabled={sl.photo >= p.imageCount - 1} onClick={() => setSlide(p.id, { photo: sl.photo + 1 })}>→</button>
                      <select style={{ ...input, marginBottom: 0, padding: "4px 6px", fontSize: "12px" }} value={sl.tag} onChange={(e) => setSlide(p.id, { tag: e.target.value })}>
                        {TAGS.map((t) => <option key={t} value={t}>{t || "Sin etiqueta"}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px" }}>
              <button style={{ ...btnGhost, opacity: savingImgs ? 0.4 : 1 }} disabled={savingImgs} onClick={saveImages}>
                {savingImgs ? "Guardando…" : "Guardar imágenes en Cloudinary"}
              </button>
              {savedUrls.length > 0 && (
                <span style={{ fontSize: "13px", color: "#16A34A" }}>
                  {savedUrls.length} guardada{savedUrls.length > 1 ? "s" : ""} ✓{" "}
                  {savedUrls.map((u, i) => <a key={u} href={u} target="_blank" rel="noreferrer" style={{ marginLeft: "6px" }}>ver {i + 1}</a>)}
                </span>
              )}
            </div>
          </div>
        )}

        <label style={label}>Indicación extra para el texto (opcional)</label>
        <input style={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: es para un drop del viernes, mencioná el local de Pinamar" />
        <button style={{ ...btn, opacity: selected.length && !loading ? 1 : 0.4 }} disabled={!selected.length || loading} onClick={generate}>
          {loading ? "Generando…" : genId ? "Generar otra" : `Generar caption (${selected.length})`}
        </button>
        {canvaConnected && templates.length > 0 && !isStory && (
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "12px" }}>
            <select style={{ ...input, marginBottom: 0, width: "auto" }} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button style={{ ...btn, opacity: selected.length && templateId && !canvaLoading ? 1 : 0.4 }}
              disabled={!selected.length || !templateId || canvaLoading} onClick={generateWithCanva}>
              {canvaLoading ? "Armando en Canva… (puede tardar 1 min)" : "Armar con plantilla de Canva"}
            </button>
          </div>
        )}
        {error && <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "12px" }}>{error}</p>}
        {canvaResult && (
          <div style={{ marginTop: "20px" }}>
            <label style={label}>Imagen armada en Canva</label>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
              {canvaResult.images.map((u) => (
                <a key={u} href={u} target="_blank" rel="noreferrer">
                  <img src={u} alt="" style={{ width: "280px", borderRadius: "8px", border: "1px solid #E5E5E5" }} />
                </a>
              ))}
            </div>
            {canvaResult.editUrls.map((u, i) => (
              <a key={u} href={u} target="_blank" rel="noreferrer" style={{ fontSize: "13px", marginRight: "12px" }}>
                Retocar {canvaResult.editUrls.length > 1 ? `imagen ${i + 1} ` : ""}en Canva →
              </a>
            ))}
          </div>
        )}

        {genId && (
          <div style={{ marginTop: "20px" }}>
            <label style={label}>Caption sugerido (editalo si querés)</label>
            <textarea style={{ ...input, minHeight: "200px" }} value={caption} onChange={(e) => setCaption(e.target.value)} />
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button style={btn} onClick={() => mark("accept")}>Aceptar y copiar</button>
              <button style={btnGhost} onClick={() => mark("discard")}>Descartar</button>
              <span style={{ fontSize: "13px", color: "#737373" }}>{caption.length} caracteres · {status}</span>
            </div>
          </div>
        )}

        {selected.length > 0 && (caption || isStory) && account && (
          <div style={{ marginTop: "24px", borderTop: "1px solid #E5E5E5", paddingTop: "20px" }}>
            <button style={{ ...btn, opacity: savingImgs ? 0.4 : 1 }} disabled={savingImgs} onClick={openPreview}>
              {savingImgs ? "Preparando imágenes…" : isStory ? "👀 Ver cómo queda la historia" : "👀 Ver cómo queda en Instagram"}
            </button>
            {preview && (
              <div style={{ display: "flex", gap: "32px", alignItems: "flex-start", marginTop: "20px", flexWrap: "wrap" }}>
                {isStory ? (
                  <StoryPreview handle={account.handle || ""} picture={account.picture} images={preview.images} />
                ) : (
                  <InstagramPreview handle={account.handle || ""} picture={account.picture} images={preview.images} caption={caption} />
                )}
                <div style={{ maxWidth: "340px", fontSize: "13px", lineHeight: 1.6 }}>
                  {!publishedUrl && <p style={{ marginBottom: "12px" }}>Así se va a ver. Si querés cambiar algo, editá arriba y volvé a tocar “Ver cómo queda”.</p>}
                  <PublishActions
                    key={preview.postId + preview.images.join()}
                    postId={preview.postId}
                    isStory={isStory}
                    handle={account.handle || ""}
                    beforeAction={async () => {
                      if (isStory) return;
                      await fetch(`/api/admin/social/posts/${preview.postId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ caption }) });
                    }}
                    onPublished={(u) => {
                      setPublishedUrl(u);
                      if (genId) mark("accept");
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
