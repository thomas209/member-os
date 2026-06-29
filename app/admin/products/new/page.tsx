"use client";
import { useState } from "react";
import ImageUpload from "@/components/admin/ImageUpload";
import { useRouter } from "next/navigation";

const SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "", slug: "", description: "",
    brandId: "", categoryId: "", gender: "UNISEX",
    price: "", comparePrice: "", costPrice: "",
    colorName: "", colorHex: "#000000",
    isFeatured: false,
  });

  if (typeof window !== "undefined" && brands.length === 0 && categories.length === 0) {
    fetch("/api/admin/brands").then(r => r.json()).then(d => setBrands(d.brands || []));
    fetch("/api/admin/categories").then(r => r.json()).then(d => setCategories(d.categories || []));
  }

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    if (e.target.name === "name") {
      setForm(prev => ({ ...prev, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }));
    } else {
      setForm(prev => ({ ...prev, [e.target.name]: value }));
    }
  };

  const toggleSize = (size) => {
    const exists = variants.find(v => v.size === size);
    if (exists) setVariants(variants.filter(v => v.size !== size));
    else setVariants([...variants, { size, stock: 0 }]);
  };

  const updateStock = (size, stock) => {
    setVariants(variants.map(v => v.size === size ? { ...v, stock: Number(stock) } : v));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.brandId || !form.categoryId) {
      setError("Completa nombre, precio, marca y categoria");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
          costPrice: form.costPrice ? Number(form.costPrice) : null,
          variants,
          images: images.map((url, i) => ({ url, isPrimary: i === 0, sortOrder: i })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error"); setLoading(false); return; }
      router.push("/admin/products");
    } catch (e) {
      setError("Error de conexion");
      setLoading(false);
    }
  };

  const inputStyle = {width:"100%",padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none",backgroundColor:"white"};
  const labelStyle = {display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"};
  const sectionStyle = {backgroundColor:"white",padding:"24px",border:"1px solid #E8E8E8",marginBottom:"16px"};
  const titleStyle = {fontSize:"13px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"20px"};

  return (
    <div style={{padding:"48px",maxWidth:"800px"}}>
      <div style={{marginBottom:"32px"}}>
        <a href="/admin/products" style={{fontSize:"12px",color:"#737373",textDecoration:"none"}}>← Productos</a>
        <h1 style={{fontSize:"24px",fontWeight:"700",letterSpacing:"-0.02em",marginTop:"8px"}}>Nuevo producto</h1>
      </div>

      <div style={sectionStyle}>
        <h2 style={titleStyle}>Informacion</h2>
        <div style={{display:"grid",gap:"16px"}}>
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Nike Air Force 1" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Slug</label>
            <input name="slug" value={form.slug} onChange={handleChange} style={{...inputStyle,color:"#737373"}} />
          </div>
          <div>
            <label style={labelStyle}>Descripcion</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} style={{...inputStyle,resize:"vertical"}} />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={titleStyle}>Precio</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"16px"}}>
          <div>
            <label style={labelStyle}>Precio ARS *</label>
            <input name="price" value={form.price} onChange={handleChange} placeholder="89999" type="number" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Precio tachado</label>
            <input name="comparePrice" value={form.comparePrice} onChange={handleChange} placeholder="99999" type="number" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Costo</label>
            <input name="costPrice" value={form.costPrice} onChange={handleChange} placeholder="45000" type="number" style={inputStyle} />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={titleStyle}>Clasificacion</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"16px"}}>
          <div>
            <label style={labelStyle}>Marca *</label>
            <select name="brandId" value={form.brandId} onChange={handleChange} style={inputStyle}>
              <option value="">Seleccionar marca</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Categoria *</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} style={inputStyle}>
              <option value="">Seleccionar categoria</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Genero</label>
            <select name="gender" value={form.gender} onChange={handleChange} style={inputStyle}>
              <option value="UNISEX">Unisex</option>
              <option value="HOMBRE">Hombre</option>
              <option value="MUJER">Mujer</option>
              <option value="NINO">Nino</option>
            </select>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginTop:"16px"}}>
          <div>
            <label style={labelStyle}>Color nombre</label>
            <input name="colorName" value={form.colorName} onChange={handleChange} placeholder="White" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Color hex</label>
            <input name="colorHex" type="color" value={form.colorHex} onChange={handleChange} style={{...inputStyle,height:"44px",padding:"4px"}} />
          </div>
        </div>
        <div style={{marginTop:"16px"}}>
          <label style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",fontSize:"13px"}}>
            <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
            Producto destacado (aparece en el home)
          </label>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={titleStyle}>Talles y stock</h2>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"20px"}}>
          {SIZES.map((size) => {
            const selected = variants.find(v => v.size === size);
            return (
              <button key={size} onClick={() => toggleSize(size)} style={{width:"48px",height:"48px",border:"1px solid",borderColor:selected?"#0A0A0A":"#E8E8E8",backgroundColor:selected?"#0A0A0A":"white",color:selected?"white":"#737373",fontSize:"13px",cursor:"pointer"}}>
                {size}
              </button>
            );
          })}
        </div>
        {variants.length > 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {variants.sort((a,b) => Number(a.size)-Number(b.size)).map((v) => (
              <div key={v.size} style={{display:"flex",alignItems:"center",gap:"16px"}}>
                <span style={{fontSize:"13px",fontWeight:"600",width:"40px"}}>T{v.size}</span>
                <input type="number" value={v.stock} onChange={(e) => updateStock(v.size, e.target.value)} min={0} style={{width:"80px",padding:"8px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none"}} />
                <span style={{fontSize:"12px",color:"#737373"}}>unidades</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <h2 style={titleStyle}>Imagenes</h2>
        <ImageUpload
          onUpload={(urls) => setImages(urls)}
          label="Agregar imagenes (podes seleccionar varias)"
          multiple={true}
        />
      </div>

      {error && <p style={{fontSize:"13px",color:"#DC2626",marginBottom:"16px"}}>{error}</p>}

      <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"16px",backgroundColor:loading?"#E8E8E8":"#0A0A0A",color:loading?"#A3A3A3":"white",fontSize:"13px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",border:"none",cursor:loading?"not-allowed":"pointer"}}>
        {loading ? "Guardando..." : "Crear producto"}
      </button>
    </div>
  );
}
