"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  category?: string;
  brand?: string;
  gender?: string;
  q?: string;
  sort?: string;
  encargo?: string;
};

export default function CatalogToolbar({ category, brand, gender, q, sort, encargo }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(q || "");

  const navigate = (overrides: Partial<Props>) => {
    const merged = { category, brand, gender, q, sort, encargo, ...overrides };
    const params = new URLSearchParams();
    if (merged.category) params.set("category", merged.category);
    if (merged.brand) params.set("brand", merged.brand);
    if (merged.gender) params.set("gender", merged.gender);
    if (merged.q) params.set("q", merged.q);
    if (merged.sort && merged.sort !== "newest") params.set("sort", merged.sort);
    if (merged.encargo) params.set("encargo", merged.encargo);
    router.push("/catalog" + (params.toString() ? "?" + params.toString() : ""));
  };

  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "24px" }}>
      <form
        onSubmit={(e) => { e.preventDefault(); navigate({ q: search }); }}
        style={{ display: "flex", flex: "1", minWidth: "220px", maxWidth: "360px" }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar productos..."
          style={{ flex: 1, padding: "10px 14px", border: "1px solid #E8E8E8", borderRight: "none", fontSize: "13px", outline: "none" }}
        />
        <button
          type="submit"
          style={{ padding: "10px 16px", border: "1px solid #0A0A0A", backgroundColor: "#0A0A0A", color: "white", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}
        >
          Buscar
        </button>
      </form>

      <select
        value={sort || "newest"}
        onChange={(e) => navigate({ sort: e.target.value })}
        style={{ padding: "10px 14px", border: "1px solid #E8E8E8", fontSize: "13px", backgroundColor: "white", color: "#0A0A0A", outline: "none" }}
      >
        <option value="newest">Más nuevo</option>
        <option value="price_asc">Precio: menor a mayor</option>
        <option value="price_desc">Precio: mayor a menor</option>
      </select>
    </div>
  );
}
