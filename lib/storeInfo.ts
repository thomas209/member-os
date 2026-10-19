// Datos reales del local para los anuncios de redes.
// Son los MISMOS que publica la landing /stores (app/(store)/stores/page.tsx).
// Si cambian los horarios, cambiarlos en los dos lugares.
export const STORE_INFO = {
  direccion: "Av. Constitución 270, Pinamar",
  telefono: "011 15-3086-6758",
  web: "memberclubargentina.com",
  instagram: "@member_ba",
  temporada: { desde: "15/12", hasta: "31/03", dias: "Todos los días", horario: "10:00 a 22:30" },
  restoDelAnio: { dias: "Viernes a domingo", horario: "10:00 a 20:00" },
  envios: "Envíos a todo el país",
  pagos: "Mercado Pago, tarjeta de crédito, débito y transferencia",
};

export type AnnouncementPreset = { id: string; nombre: string; titulo: string; subtitulo?: string; lineas: string[] };

export function announcementPresets(): AnnouncementPreset[] {
  const s = STORE_INFO;
  return [
    {
      id: "temporada",
      nombre: "Horarios de temporada",
      titulo: "Horarios",
      subtitulo: `Temporada · del ${s.temporada.desde} al ${s.temporada.hasta}`,
      lineas: [`${s.temporada.dias}: ${s.temporada.horario}`, `Dirección: ${s.direccion}`],
    },
    {
      id: "fuera",
      nombre: "Horarios fuera de temporada",
      titulo: "Horarios",
      lineas: [`${s.restoDelAnio.dias}: ${s.restoDelAnio.horario}`, `Dirección: ${s.direccion}`],
    },
    {
      id: "ambos",
      nombre: "Horarios (temporada y resto del año)",
      titulo: "Horarios",
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
      lineas: [`Dirección: ${s.direccion}`, `Teléfono: ${s.telefono}`, `Web: ${s.web}`],
    },
    {
      id: "envios",
      nombre: "Envíos y pagos",
      titulo: "Envíos a todo el país",
      lineas: [`Pagos: ${s.pagos}`, `Web: ${s.web}`],
    },
  ];
}
