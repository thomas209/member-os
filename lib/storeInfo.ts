// Datos reales del local para los anuncios de redes.
// Son los MISMOS que publica la landing /stores (app/(store)/stores/page.tsx).
// Si cambian los horarios, cambiarlos en los dos lugares.
export const STORE_INFO = {
  direccion: "Av. Constitución 270, Pinamar",
  telefono: "011 15-3086-6758",
  web: "memberclubargentina.com",
  instagram: "@member_ba",
  temporada: { desde: "15/12", hasta: "31/03", dias: "Todos los días", horario: "10:00 a 22:30" },
  restoDelAnio: { dias: "Viernes a domingo", horario: "11 a 14 y 17 a 20 hs" },
  envios: "Envíos a todo el país",
  // Tiempos de envío (los mismos de la historia de envíos de Canva).
  tiemposEnvio: [
    { zona: "CABA y alrededores", plazo: "24 a 48 hs hábiles" },
    { zona: "Interior", plazo: "2 a 6 días hábiles" },
    { zona: "Encargos", plazo: "10 a 14 días hábiles" },
  ],
  envioGratisDesde: "$180.000",
  pagos: "Mercado Pago, tarjeta de crédito, débito y transferencia",
};

// bloques + nota: los usa la plantilla de Canva (titulo, subtitulo, 3 bloques
// con su detalle y una nota). lineas: el diseño simple de respaldo.
export type AnnouncementPreset = {
  id: string; nombre: string; titulo: string; subtitulo?: string; lineas: string[];
  bloques?: { titulo: string; detalle: string }[]; nota?: string; corto?: string;
};

// ¿Hoy es temporada (15/12 al 31/03)?
export function enTemporada(now = new Date()) {
  const [dd, dm] = STORE_INFO.temporada.desde.split("/").map(Number);
  const [hd, hm] = STORE_INFO.temporada.hasta.split("/").map(Number);
  const md = (now.getMonth() + 1) * 100 + now.getDate();
  return md >= dm * 100 + dd || md <= hm * 100 + hd;
}

export function announcementPresets(): AnnouncementPreset[] {
  const s = STORE_INFO;
  return [
    {
      id: "temporada",
      nombre: "Horarios de temporada",
      titulo: "Horarios",
      corto: "horarios",
      subtitulo: `Temporada · del ${s.temporada.desde} al ${s.temporada.hasta}`,
      lineas: [`${s.temporada.dias}: ${s.temporada.horario}`, `Dirección: ${s.direccion}`],
      bloques: [{ titulo: s.temporada.dias, detalle: s.temporada.horario }, { titulo: "Dirección", detalle: s.direccion.replace(", Pinamar", "") }],
      nota: `Temporada del ${s.temporada.desde} al ${s.temporada.hasta}`,
    },
    {
      id: "fuera",
      nombre: "Horarios fuera de temporada",
      titulo: "Horarios",
      corto: "horarios",
      lineas: [`${s.restoDelAnio.dias}: ${s.restoDelAnio.horario}`, `Dirección: ${s.direccion}`],
      subtitulo: "Member Club Pinamar",
      bloques: [{ titulo: s.restoDelAnio.dias, detalle: s.restoDelAnio.horario }, { titulo: "Dirección", detalle: s.direccion.replace(", Pinamar", "") }],
      nota: "Te esperamos",
    },
    {
      id: "ambos",
      nombre: "Horarios (temporada y resto del año)",
      titulo: "Horarios",
      corto: "horarios",
      lineas: [
        `Temporada (${s.temporada.desde} al ${s.temporada.hasta}): ${s.temporada.dias.toLowerCase()}`,
        `Horario: ${s.temporada.horario}`,
        `Resto del año: ${s.restoDelAnio.dias.toLowerCase()}`,
        `Horario: ${s.restoDelAnio.horario}`,
      ],
    },
    {
      id: "contacto",
      nombre: "Dónde estamos",
      titulo: "Visitanos",
      corto: "visitanos",
      lineas: [`Dirección: ${s.direccion}`, `Teléfono: ${s.telefono}`, `Web: ${s.web}`],
      subtitulo: "Member Club Pinamar",
      bloques: [
        { titulo: "Dirección", detalle: s.direccion.replace(", Pinamar", "") },
        { titulo: (enTemporada() ? s.temporada : s.restoDelAnio).dias, detalle: (enTemporada() ? s.temporada : s.restoDelAnio).horario },
        { titulo: "Teléfono", detalle: s.telefono },
      ],
      nota: "Te esperamos",
    },
    {
      id: "envios",
      nombre: "Envíos y pagos",
      titulo: "Envíos a todo el país",
      corto: "envios",
      subtitulo: "Tiempos de envío",
      lineas: [`Pagos: ${s.pagos}`, `Web: ${s.web}`],
      bloques: s.tiemposEnvio.map((t) => ({ titulo: t.zona, detalle: t.plazo })),
      nota: `*Envío sin cargo en compras desde ${s.envioGratisDesde}`,
    },
  ];
}
