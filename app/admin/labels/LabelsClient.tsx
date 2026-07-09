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

  return (
    <div>
      {/* UI de selección — se oculta al imprimir */}
      <div className="labels-ui" style={{ padding: "48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "4px" }}>Etiquetas QR</h1>
            <p style={{ fontSize: "13px", color: "#737373" }}>{selectedLabels.length} etiquetas seleccionadas</p>
          </div>
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
            display: flex;
            flex-wrap: wrap;
            gap: 0;
          }
          .label {
            width: 40mm;
            height: 30mm;
            padding: 2mm;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            gap: 2mm;
            border: 1px dashed #ccc;
            page-break-inside: avoid;
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
            font-size: 7pt;
            font-weight: 700;
            margin: 0;
            line-height: 1.1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
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
            size: auto;
            margin: 5mm;
          }
        }
      `}</style>
    </div>
  );
}
