"use client";
import { useState } from "react";

type Props = {
  onUpload: (urls: string[]) => void;
  label?: string;
  multiple?: boolean;
};

// Redimensiona y comprime la imagen en el navegador antes de subirla,
// para no superar el límite de tamaño de request de Vercel (~4.5MB).
async function compressImage(file: File, maxDimension = 1600, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No se pudo procesar la imagen")); return; }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("No se pudo comprimir la imagen")); return; }
          const newName = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, "") + ".webp";
          resolve(new File([blob], newName, { type: "image/webp" }));
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("No se pudo leer la imagen")); };
    img.src = objectUrl;
  });
}

export default function ImageUpload({ onUpload, label = "Subir imagen", multiple = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith("image/")) { setError("Solo se permiten imagenes"); return; }
      if (file.size > 20 * 1024 * 1024) { setError("Cada imagen no puede superar 20MB"); return; }
    }

    setLoading(true);
    setError("");

    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const compressed = await compressImage(file);

        const formData = new FormData();
        formData.append("file", compressed);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Error al subir"); setLoading(false); return; }
        uploadedUrls.push(data.url);
      }
      const newImages = [...localImages, ...uploadedUrls];
      setLocalImages(newImages);
      onUpload(newImages);
      setLoading(false);
    } catch (err) {
      setError("Error de conexion");
      setLoading(false);
    }
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newImages = [...localImages];
    const dragged = newImages.splice(dragIndex, 1)[0];
    newImages.splice(index, 0, dragged);
    setLocalImages(newImages);
    setDragIndex(index);
    onUpload(newImages);
  };

  const handleDragEnd = () => setDragIndex(null);

  const removeImage = (index: number) => {
    const newImages = localImages.filter((_, i) => i !== index);
    setLocalImages(newImages);
    onUpload(newImages);
  };

  return (
    <div>
      <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>
        {label}
      </label>
      <div style={{border:"1px dashed #D1D1D1",padding:"32px",textAlign:"center",backgroundColor:"#FAFAFA",position:"relative",cursor:"pointer",marginBottom:"16px"}}>
        <input type="file" accept="image/*" multiple={multiple} onChange={handleFile} disabled={loading}
          style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%"}} />
        <div style={{fontSize:"32px",marginBottom:"8px"}}>+</div>
        <p style={{fontSize:"13px",color:"#737373"}}>
          {loading ? "Subiendo imagenes..." : "Clickea para seleccionar imagenes"}
        </p>
        <p style={{fontSize:"11px",color:"#A3A3A3",marginTop:"4px"}}>JPG, PNG, WebP — max 20MB por imagen</p>
      </div>

      {localImages.length > 0 && (
        <div>
          <p style={{fontSize:"11px",color:"#737373",marginBottom:"8px",letterSpacing:"0.06em"}}>
            ARRASTRA PARA REORDENAR — LA PRIMERA ES LA PORTADA
          </p>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {localImages.map((url, i) => (
              <div
                key={url + i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                style={{
                  position:"relative",cursor:"grab",
                  opacity: dragIndex === i ? 0.5 : 1,
                  border: i === 0 ? "2px solid #0A0A0A" : "1px solid #E8E8E8",
                }}
              >
                <img src={url} alt="" style={{width:"80px",height:"100px",objectFit:"cover",display:"block"}} />
                {i === 0 && (
                  <span style={{position:"absolute",bottom:0,left:0,right:0,fontSize:"9px",backgroundColor:"#0A0A0A",color:"white",padding:"3px 4px",textAlign:"center",letterSpacing:"0.06em"}}>
                    PORTADA
                  </span>
                )}
                <button
                  onClick={() => removeImage(i)}
                  style={{position:"absolute",top:"4px",right:"4px",background:"#DC2626",border:"none",color:"white",width:"18px",height:"18px",fontSize:"10px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"2px"}}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p style={{fontSize:"12px",color:"#DC2626",marginTop:"8px"}}>{error}</p>}
    </div>
  );
}
