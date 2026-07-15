import { redirect } from "next/navigation";

// /admin solo (sin nada despues) nunca tuvo pantalla propia — el
// middleware ya manda a /admin/login si no estas logueado, asi que ir
// directo a /admin/orders alcanza: si no hay sesion, redirige a login;
// si la hay, entra directo al panel de pedidos.
export default function AdminIndexPage() {
  redirect("/admin/orders");
}
