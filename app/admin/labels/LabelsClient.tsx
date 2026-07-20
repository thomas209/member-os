"use client";
import { useState } from "react";

type Variant = { id: string; size: string; stock: number; qrDataUrl: string };
type Product = { id: string; name: string; brand: string; price: number; image: string | null; variants: Variant[] };

export default function LabelsClient({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (variantId: string) => {
    const next = new Set(selected);
    if (next.has(variantId)) next.delete(variantId);
    else next.add(variantId);
    setSelected(next);
  };

  const toggleAllForProduct = (product: Product) => {
    const allSelected = product.variants.every((v) => selected.has(v.id));
    const next = new Set(selected);
    product.variants.forEach((v) => {
      if (allSelected) next.delete(v.id);
      else next.add(v.id);
    });
    setSelected(next);
  };

  const selectedLabels = products.flatMap((p) =>
    p.variants
      .filter((v) => selected.has(v.id))
      .map((v) => ({ product: p, variant: v }))
  );

  const handlePrint = () => window.print();

  // Export PNG: arma cada etiqueta en un canvas (mismo layout que la hoja de impresion)
  // y la descarga como imagen, para poder usarla con impresoras sin driver de sistema (ej. Niimbot).
  const LABEL_PNG_SCALE = 12; // px por mm (~305dpi)
  const LABEL_PNG_W_MM = 40;
  const LABEL_PNG_H_MM = 30;
  const LABEL_PNG_QR_MM = 20;
  const LABEL_PNG_PAD_MM = 1;
  const LABEL_PNG_GAP_MM = 2;

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const wrapLabelText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) => {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(test).width > maxWidth) {
        lines.push(current);
        current = word;
        if (lines.length === maxLines) break;
      } else {
        current = test;
      }
    }
    if (current && lines.length < maxLines) lines.push(current);
    if (lines.length > maxLines) lines.length = maxLines;
    const consumedWords = lines.join(" ").split(" ").length;
    if (consumedWords < words.length && lines.length === maxLines) {
      let last = lines[maxLines - 1];
      while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 0) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = `${last}…`;
    }
    return lines;
  };

  const downloadLabelPng = async (product: Product, variant: Variant) => {
    const canvas = document.createElement("canvas");
    canvas.width = LABEL_PNG_W_MM * LABEL_PNG_SCALE;
    canvas.height = LABEL_PNG_H_MM * LABEL_PNG_SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const ptToPx = (pt: number) => (pt * LABEL_PNG_SCALE * 25.4) / 72;
    const padPx = LABEL_PNG_PAD_MM * LABEL_PNG_SCALE;
    const gapPx = LABEL_PNG_GAP_MM * LABEL_PNG_SCALE;
    const qrPx = LABEL_PNG_QR_MM * LABEL_PNG_SCALE;

    const qrImg = await loadImage(variant.qrDataUrl);
    const qrY = (canvas.height - qrPx) / 2;
    ctx.drawImage(qrImg, padPx, qrY, qrPx, qrPx);

    const textX = padPx + qrPx + gapPx;
    const maxTextWidth = canvas.width - textX - padPx;
    ctx.textBaseline = "alphabetic";

    let y = qrY + ptToPx(6);
    ctx.fillStyle = "#666";
    ctx.font = `${ptToPx(6)}px Arial`;
    ctx.fillText(product.brand.toUpperCase(), textX, y);

    ctx.fillStyle = "#000";
    ctx.font = `bold ${ptToPx(6)}px Arial`;
    const nameLines = wrapLabelText(ctx, product.name, maxTextWidth, 2);
    const nameLineHeight = ptToPx(6) * 1.15;
    nameLines.forEach((line) => {
      y += nameLineHeight;
      ctx.fillText(line, textX, y);
    });

    ctx.font = `${ptToPx(6.5)}px Arial`;
    y += ptToPx(6.5) * 1.3;
    ctx.fillText(`Talle ${variant.size}`, textX, y);

    ctx.font = `bold ${ptToPx(8)}px Arial`;
    y += ptToPx(8) * 1.3;
    ctx.fillText(`$${product.price.toLocaleString("es-AR")}`, textX, y);

    await new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `etiqueta-${product.brand}-talle-${variant.size}-${variant.id}.png`.replace(/\s+/g, "-");
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    });
  };

  const handleExportPng = async () => {
    for (const { product, variant } of selectedLabels) {
      await downloadLabelPng(product, variant);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  };

  return (
    <div>
      {/* UI de selección — se oculta al imprimir */}
      <div className="labels-ui" style={{ padding: "48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "4px" }}>Etiquetas QR</h1>
            <p style={{ fontSize: "13px", color: "#737373" }}>{selectedLabels.length} etiquetas seleccionadas</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleExportPng}
              disabled={selectedLabels.length === 0}
              style={{
                padding: "12px 24px",
                backgroundColor: "transparent",
                color: selectedLabels.length === 0 ? "#A3A3A3" : "#0A0A0A",
                fontSize: "12px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase",
                border: "1px solid " + (selectedLabels.length === 0 ? "#E8E8E8" : "#0A0A0A"),
                cursor: selectedLabels.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Exportar PNG
            </button>
            <button
              onClick={handlePrint}
              disabled={selectedLabels.length === 0}
              style={{
                padding: "12px 24px",
                backgroundColor: selectedLabels.length === 0 ? "#E8E8E8" : "#0A0A0A",
                color: selectedLabels.length === 0 ? "#A3A3A3" : "white",
                fontSize: "12px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase",
                border: "none", cursor: selectedLabels.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Imprimir seleccionadas
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8" }}>
          {products.map((product) => {
            const allSelected = product.variants.every((v) => selected.has(v.id));
            return (
              <div key={product.id} style={{ borderBottom: "1px solid #F4F4F4", padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <input type="checkbox" checked={allSelected} onChange={() => toggleAllForProduct(product)} />
                  {product.image ? (
                    <img src={product.image} alt={product.name} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px" }} />
                  ) : (
                    <div style={{ width: "36px", height: "36px", backgroundColor: "#F4F4F4", borderRadius: "4px", flexShrink: 0 }} />
                  )}
                  <p style={{ fontSize: "13px", fontWeight: "600" }}>{product.brand} — {product.name}</p>
                  <span style={{ fontSize: "12px", color: "#737373" }}>${product.price.toLocaleString("es-AR")}</span>
                </div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", paddingLeft: "28px" }}>
                  {product.variants.map((v) => (
                    <label key={v.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "6px 10px", border: "1px solid #E8E8E8", cursor: "pointer" }}>
                      <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggle(v.id)} />
                      Talle {v.size} · Stock {v.stock}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hoja de impresión — solo visible al imprimir */}
      <div className="labels-print-sheet">
        {selectedLabels.map(({ product, variant }) => (
          <div key={variant.id} className="label">
            <img src={variant.qrDataUrl} alt="QR" className="label-qr" />
            <div className="label-text">
              <p className="label-brand">{product.brand}</p>
              <p className="label-name">{product.name}</p>
              <p className="label-size">Talle {variant.size}</p>
              <p className="label-price">${product.price.toLocaleString("es-AR")}</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .labels-print-sheet { display: none; }

        @media print {
          .labels-ui { display: none; }
          .labels-print-sheet {
            display: block;
          }
          .label {
            width: 40mm;
            height: 30mm;
            padding: 1mm;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            gap: 2mm;
            border: none;
            page-break-after: always;
            break-after: page;
          }
          .label:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }
          .label-qr {
            width: 20mm;
            height: 20mm;
            flex-shrink: 0;
          }
          .label-text {
            font-family: Arial, sans-serif;
            overflow: hidden;
          }
          .label-brand {
            font-size: 6pt;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #666;
            margin: 0;
          }
          .label-name {
            font-size: 6pt;
            font-weight: 700;
            margin: 0;
            line-height: 1.1;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .label-size {
            font-size: 6.5pt;
            margin: 0;
          }
          .label-price {
            font-size: 8pt;
            font-weight: 700;
            margin: 0;
          }
          @page {
            size: 40mm 30mm;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
