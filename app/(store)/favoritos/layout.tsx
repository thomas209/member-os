import type { Metadata } from "next";

// Favoritos es personal de cada visitante: no tiene sentido en Google.
export const metadata: Metadata = {
  title: "Favoritos",
  robots: { index: false, follow: true },
};

export default function FavoritosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
