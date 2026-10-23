"use client";
import { useState } from "react";
import { CALZADO_TABLE, INDUMENTARIA_TABLE } from "@/lib/sizeGuide";

type SizeGuideType = "calzado" | "indumentaria";

export default function SizeGuideModal({ type }: { type: SizeGuideType }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] text-neutral-500 underline underline-offset-2 hover:text-neutral-900 transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        Guía de talles
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 z-[100]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Guía de talles"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md max-h-[80vh] overflow-y-auto bg-white z-[101]"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              <p className="text-[11px] font-semibold tracking-widest uppercase">Guía de talles</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="text-neutral-400 hover:text-neutral-900 text-xl leading-none cursor-pointer bg-transparent border-none"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {type === "calzado" ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-neutral-400 border-b border-neutral-100">
                      <th className="py-2 font-semibold">ARG</th>
                      <th className="py-2 font-semibold">US</th>
                      <th className="py-2 font-semibold">EU</th>
                      <th className="py-2 font-semibold">CM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CALZADO_TABLE.map((row) => (
                      <tr key={row.ar} className="border-b border-neutral-50">
                        <td className="py-2">{row.ar}</td>
                        <td className="py-2">{row.us}</td>
                        <td className="py-2">{row.eu}</td>
                        <td className="py-2">{row.cm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-neutral-400 border-b border-neutral-100">
                      <th className="py-2 font-semibold">Talle</th>
                      <th className="py-2 font-semibold">Pecho (cm)</th>
                      <th className="py-2 font-semibold">Cintura (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INDUMENTARIA_TABLE.map((row) => (
                      <tr key={row.size} className="border-b border-neutral-50">
                        <td className="py-2">{row.size}</td>
                        <td className="py-2">{row.pecho}</td>
                        <td className="py-2">{row.cintura}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="text-xs text-neutral-400 mt-4">
                Medidas de referencia. Si estás entre dos talles, te recomendamos elegir el más grande.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
