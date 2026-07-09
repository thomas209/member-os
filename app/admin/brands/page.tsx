"use client";
import { useState, useEffect } from "react";

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editingLogoId, setEditingLogoId] = useState<string | null>(null);
  const [logoInput, setLogoInput] = useState("");

  const fetchBrands = () => {
    fetch("/api/admin/brands").then(r => r.json()).then(d => setBrands(d.brands || []));
  };

  useEffect(() => { fetchBrands(); }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
    setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  const handleCreate = async () => {
    if (!newName) { setError("Ingresa un nombre"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, slug: newSlug }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Error"); setLoading(false); return; }
    setNewName(""); setNewSlug(""); setLoading(false); fetchBrands();
  };

  const toggleActive = async (id, isActive) => {
    await fetch("/api/admin/brands/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchBrands();
  };

  const startEditingLogo = (brand: any) => {
    setEditingLogoId(brand.id);
    setLogoInput(brand.logoUrl || "");
  };

  const cancelEditingLogo = () => {
    setEditingLogoId(null);
    setLogoInput("");
  };

  const saveLogo = async (id: string) => {
    await fetch("/api/admin/brands/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoUrl: logoInput || null }),
    });
    setEditingLogoId(null);
    setLogoInput("");
    fetchBrands();
  };

  const inputStyle = {width:"100%",padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none",backgroundColor:"white"};
  const labelStyle = {display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"};

  return (
    <div style={{padding:"48px",maxWidth:"900px"}}>
      <div style={{marginBottom:"32px"}}>
        <h1 style={{fontSize:"24px",fontWeight:"700",letterSpacing:"-0.02em",marginBottom:"4px"}}>Marcas</h1>
        <p style={{fontSize:"13px",color:"#737373"}}>{brands.length} marcas en total</p>
      </div>
      <div style={{backgroundColor:"white",padding:"24px",border:"1px solid #E8E8E8",marginBottom:"32px"}}>
        <h2 style={{fontSize:"13px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"20px"}}>Nueva marca</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input value={newName} onChange={handleNameChange} placeholder="Jordan" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Slug</label>
            <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} style={{...inputStyle,color:"#737373"}} />
          </div>
        </div>
        {error && <p style={{fontSize:"12px",color:"#DC2626",marginBottom:"12px"}}>{error}</p>}
        <button onClick={handleCreate} disabled={loading} style={{padding:"12px 24px",backgroundColor:loading?"#E8E8E8":"#0A0A0A",color:loading?"#A3A3A3":"white",fontSize:"12px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",border:"none",cursor:loading?"not-allowed":"pointer"}}>
          {loading ? "Guardando..." : "Crear marca"}
        </button>
      </div>
      <div style={{backgroundColor:"white",border:"1px solid #E8E8E8"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #E8E8E8"}}>
              {["Logo","Nombre","Slug","Estado",""].map((h) => (
                <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {brands.map((brand: any) => (
              <tr key={brand.id} style={{borderBottom:"1px solid #F4F4F4"}}>
                <td style={{padding:"16px"}}>
                  {editingLogoId === brand.id ? (
                    <div style={{display:"flex",flexDirection:"column",gap:"8px",minWidth:"260px"}}>
                      <input
                        value={logoInput}
                        onChange={(e) => setLogoInput(e.target.value)}
                        placeholder="https://res.cloudinary.com/..."
                        style={{...inputStyle,fontSize:"12px",padding:"8px"}}
                      />
                      <div style={{display:"flex",gap:"8px"}}>
                        <button onClick={() => saveLogo(brand.id)} style={{fontSize:"11px",fontWeight:"600",padding:"6px 12px",backgroundColor:"#0A0A0A",color:"white",border:"none",cursor:"pointer"}}>
                          Guardar
                        </button>
                        <button onClick={cancelEditingLogo} style={{fontSize:"11px",padding:"6px 12px",backgroundColor:"white",color:"#737373",border:"1px solid #E8E8E8",cursor:"pointer"}}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : brand.logoUrl ? (
                    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                      <img src={brand.logoUrl} alt={brand.name} style={{height:"28px",maxWidth:"90px",objectFit:"contain"}} />
                      <button onClick={() => startEditingLogo(brand)} style={{fontSize:"11px",color:"#737373",background:"none",border:"none",textDecoration:"underline",cursor:"pointer"}}>
                        Editar
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEditingLogo(brand)} style={{fontSize:"11px",color:"#737373",background:"none",border:"1px solid #E8E8E8",padding:"6px 10px",cursor:"pointer"}}>
                      + Agregar logo
                    </button>
                  )}
                </td>
                <td style={{padding:"16px",fontSize:"13px",fontWeight:"500"}}>{brand.name}</td>
                <td style={{padding:"16px",fontSize:"12px",color:"#737373",fontFamily:"monospace"}}>{brand.slug}</td>
                <td style={{padding:"16px"}}>
                  <span style={{fontSize:"11px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",color:brand.isActive?"#16A34A":"#737373",backgroundColor:brand.isActive?"#DCFCE7":"#F4F4F4",padding:"4px 8px"}}>
                    {brand.isActive ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td style={{padding:"16px"}}>
                  <button onClick={() => toggleActive(brand.id, brand.isActive)} style={{fontSize:"12px",color:"#737373",background:"none",border:"1px solid #E8E8E8",padding:"6px 12px",cursor:"pointer"}}>
                    {brand.isActive ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
