"use client";
import { useState } from "react";
import ImageUpload from "@/components/admin/ImageUpload";

const SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

export default function EditProductForm({ product, brands, categories }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>(product.images.map((img: any) => img.url));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [variants, setVariants] = useState(product.variants.map((v: any) => ({ size: v.size, stock: v.stock })));
  const [form, setForm] = useState({
    name: product.name || "",
    slug: product.slug || "",
    description: product.description || "",
    brandId: product.brandId || "",
    categoryId: product.categoryId || "",
    gender: product.gender || "UNISEX",
    price: product.price?.toString() || "",
    comparePrice: product.comparePrice?.toString() || "",
    costPrice: product.costPrice?.toString() || "",
    colorName: product.colorName || "",
    colorHex: product.colorHex || "#000000",
    isFeatured: product.isFeatured || false,
    isActive: product.isActive ?? true,
  });

  const handleChange = (e: any) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: value }));
  };

  const toggleSize = (size: string) => {
    const exists = variants.find((v: any) => v.size === size);
    if (exists) setVariants(variants.filter((v: any) => v.size !== size));
    else setVariants([...variants, { size, stock: 0 }]);
  };

  const updateStock = (size: string, stock: number) => {
    setVariants(variants.map((v: any) => v.size === size ? { ...v, stock: Number(stock) } : v));
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newImages = [...images];
    const dragged = newImages.splice(dragIndex, 1)[0];
    newImages.splice(index, 0, dragged);
    setImages(newImages);
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);
  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.brandId || !form.categoryId) {
      setError("Completa nombre, precio, marca y categoria");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products/" + product.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
          costPrice: form.costPrice ? Number(form.costPrice) : null,
          variants,
          images,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error"); setLoading(false); return; }
      window.location.href = "/admin/products";
    } catch (e) {
      setError("Error de conexion");
      setLoading(false);
    }
  };

  const inputStyle = {width:"100%",padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none",backgroundColor:"white"};
  const labelStyle = {display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#737373",marginBottom:"8px"};
  const sectionStyle = {backgroundColor:"white",padding:"24px",border:"1px solid #E8E8E8",marginBottom:"16px"};
  const titleStyle = {fontSize:"13px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase" as const,marginBottom:"20px"};

  return (
    <div style={{padding:"48px",maxWidth:"800px"}}>
      <div style={{marginBottom:"32px"}}>
        <a href="/admin/products" style={{fontSize:"12px",color:"#737373",textDecoration:"none"}}>← Productos</a>
        <h1 style={{fontSize:"24px",fontWeight:"700",letterSpacing:"-0.02em",marginTop:"8px"}}>Editar producto</h1>
        <p style={{fontSize:"13px",color:"#737373",marginTop:"4px"}}>{product.name}</p>
      </div>

      <div style={sectionStyle}>
        <h2 style={titleStyle}>Informacion</h2>
        <div style={{display:"grid",gap:"16px"}}>
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input name="name" value={form.name} onChange={handleChange} style={inputStyle} />
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
            <input name="price" value={form.price} onChange={handleChange} type="number" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Precio tachado</label>
            <input name="comparePrice" value={form.comparePrice} onChange={handleChange} type="number" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Costo</label>
            <input name="costPrice" value={form.costPrice} onChange={handleChange} type="number" style={inputStyle} />
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
              {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Categoria *</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} style={inputStyle}>
              <option value="">Seleccionar categoria</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
            <input name="colorName" value={form.colorName} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Color hex</label>
            <input name="colorHex" type="color" value={form.colorHex} onChange={handleChange} style={{...inputStyle,height:"44px",padding:"4px"}} />
          </div>
        </div>
        <div style={{marginTop:"16px",display:"flex",gap:"24px"}}>
          <label style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",fontSize:"13px"}}>
            <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
            Producto destacado
          </label>
          <label style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",fontSize:"13px"}}>
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
            Producto activo
          </label>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={titleStyle}>Talles y stock</h2>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"20px"}}>
          {SIZES.map((size) => {
            const selected = variants.find((v: any) => v.size === size);
            return (
              <button key={size} onClick={() => toggleSize(size)} style={{width:"48px",height:"48px",border:"1px solid",borderColor:selected?"#0A0A0A":"#E8E8E8",backgroundColor:selected?"#0A0A0A":"white",color:selected?"white":"#737373",fontSize:"13px",cursor:"pointer"}}>
                {size}
              </button>
            );
          })}
        </div>
        {variants.length > 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {variants.sort((a: any,b: any) => Number(a.size)-Number(b.size)).map((v: any) => (
              <div key={v.size} style={{display:"flex",alignItems:"center",gap:"16px"}}>
                <span style={{fontSize:"13px",fontWeight:"600",width:"40px"}}>T{v.size}</span>
                <input type="number" value={v.stock} onChange={(e) => updateStock(v.size, Number(e.target.value))} min={0} style={{width:"80px",padding:"8px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none"}} />
                <span style={{fontSize:"12px",color:"#737373"}}>unidades</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <h2 style={titleStyle}>Imagenes</h2>
        {images.length > 0 && (
          <div>
            <p style={{fontSize:"11px",color:"#737373",marginBottom:"8px",letterSpacing:"0.06em"}}>ARRASTRA PARA REORDENAR — LA PRIMERA ES LA PORTADA</p>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"16px"}}>
              {images.map((url, i) => (
                <div
                  key={url + i}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  style={{position:"relative",cursor:"grab",opacity:dragIndex===i?0.5:1,border:i===0?"2px solid #0A0A0A":"1px solid #E8E8E8"}}
                >
                  <img src={url} alt="" style={{width:"80px",height:"100px",objectFit:"cover",display:"block"}} />
                  {i === 0 && <span style={{position:"absolute",bottom:0,left:0,right:0,fontSize:"9px",backgroundColor:"#0A0A0A",color:"white",padding:"3px",textAlign:"center"}}>PORTADA</span>}
                  <button onClick={() => removeImage(i)} style={{position:"absolute",top:"4px",right:"4px",background:"#DC2626",border:"none",color:"white",width:"18px",height:"18px",fontSize:"10px",cursor:"pointer"}}>x</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <ImageUpload
          onUpload={(urls) => setImages(prev => [...prev, ...urls])}
          label="Agregar mas imagenes"
          multiple={true}
        />
      </div>

      {error && <p style={{fontSize:"13px",color:"#DC2626",marginBottom:"16px"}}>{error}</p>}

      <div style={{display:"flex",gap:"16px"}}>
        <button onClick={handleSubmit} disabled={loading} style={{flex:1,padding:"16px",backgroundColor:loading?"#E8E8E8":"#0A0A0A",color:loading?"#A3A3A3":"white",fontSize:"13px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",border:"none",cursor:loading?"not-allowed":"pointer"}}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        <a href="/admin/products" style={{padding:"16px 24px",border:"1px solid #E8E8E8",fontSize:"13px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",textDecoration:"none",color:"#737373",backgroundColor:"white"}}>
          Cancelar
        </a>
      </div>
    </div>
  );
}
