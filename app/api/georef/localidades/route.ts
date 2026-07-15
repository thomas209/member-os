import { NextResponse } from "next/server";

// Proxy a la API publica de Georef (datos.gob.ar) para traer las
// localidades reales de una provincia argentina. Pasa por nuestro propio
// server (en vez de pegarle directo desde el navegador) para no depender
// de CORS del lado del cliente. Si el servicio de Georef falla o esta
// caido, devuelve una lista vacia en vez de un error: el checkout tiene
// que poder seguir funcionando igual (el campo de ciudad simplemente
// queda como texto libre, sin sugerencias).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provincia = (searchParams.get("provincia") || "").trim();

  if (!provincia) {
    return NextResponse.json({ localidades: [] });
  }

  try {
    const url =
      "https://apis.datos.gob.ar/georef/api/localidades?" +
      new URLSearchParams({ provincia, campos: "nombre", max: "3000", orden: "nombre" });

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      return NextResponse.json({ localidades: [] });
    }

    const data = await res.json();
    const nombres: string[] = Array.from(
      new Set((data.localidades || []).map((l: { nombre: string }) => l.nombre))
    );

    return NextResponse.json({ localidades: nombres });
  } catch (error) {
    console.error("Error consultando Georef:", error);
    return NextResponse.json({ localidades: [] });
  }
}

export const dynamic = "force-dynamic";
