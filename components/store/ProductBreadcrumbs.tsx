type Props = {
  categoryName: string;
  categorySlug: string;
  productName: string;
};

export default function ProductBreadcrumbs({ categoryName, categorySlug, productName }: Props) {
  return (
    <div className="mb-4 md:mb-6">
      {/* Mobile — reemplaza breadcrumbs por volver al catálogo */}
      <a
        href="/catalog"
        className="flex md:hidden items-center gap-1 text-[12px] text-neutral-500 hover:text-neutral-900 transition-colors w-fit"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Volver al catálogo
      </a>

      {/* Desktop — breadcrumbs */}
      <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-[11px] tracking-wide text-neutral-400">
        <a href="/" className="hover:text-neutral-900 transition-colors">Inicio</a>
        <span aria-hidden="true">/</span>
        <a href={`/catalog?category=${categorySlug}`} className="hover:text-neutral-900 transition-colors">
          {categoryName}
        </a>
        <span aria-hidden="true">/</span>
        <span className="text-neutral-600 truncate max-w-[320px]" aria-current="page">
          {productName}
        </span>
      </nav>
    </div>
  );
}
