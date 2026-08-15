export default function ProductLoading() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 md:px-12 md:py-12 animate-pulse">
      {/* Breadcrumbs */}
      <div className="h-3 w-40 bg-neutral-100 rounded-sm mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-20">
        {/* Galería */}
        <div className="flex flex-col gap-3">
          <div className="aspect-[4/5] bg-neutral-100" />
          <div className="hidden md:flex gap-2">
            <div className="w-16 h-20 bg-neutral-100" />
            <div className="w-16 h-20 bg-neutral-100" />
            <div className="w-16 h-20 bg-neutral-100" />
          </div>
        </div>

        {/* Info */}
        <div className="pt-0 md:pt-6 pb-24 md:pb-0">
          <div className="h-3 w-20 bg-neutral-100 rounded-sm mb-3" />
          <div className="h-7 md:h-9 w-3/4 bg-neutral-100 rounded-sm mb-3" />
          <div className="h-4 w-24 bg-neutral-100 rounded-sm mb-6" />
          <div className="h-7 w-28 bg-neutral-100 rounded-sm mb-8" />

          {/* Selector de talles */}
          <div className="flex gap-2 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-11 h-11 bg-neutral-100 rounded-sm" />
            ))}
          </div>

          {/* Botón agregar al carrito */}
          <div className="h-12 w-full bg-neutral-100" />

          {/* Descripción */}
          <div className="mt-10 pt-10 border-t border-neutral-100">
            <div className="h-3 w-24 bg-neutral-100 rounded-sm mb-4" />
            <div className="h-3 w-full bg-neutral-100 rounded-sm mb-2" />
            <div className="h-3 w-5/6 bg-neutral-100 rounded-sm mb-2" />
            <div className="h-3 w-2/3 bg-neutral-100 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
