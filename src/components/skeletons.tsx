function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-ink/10 ${className}`} />;
}

export function FilterSkeleton() {
  return (
    <div className="mt-8 grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_8rem_1.4fr_auto]">
      {["Марка", "Модель", "Год", "Артикул"].map((label) => (
        <div className="flex flex-col gap-1.5" key={label}>
          <Bone className="h-3 w-16" />
          <Bone className="h-10 w-full" />
        </div>
      ))}
      <Bone className="h-10 w-full lg:w-24" />
    </div>
  );
}

export function CatalogResultsSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">Загрузка каталога</span>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <li
            className="overflow-hidden rounded-2xl border border-line bg-surface"
            key={index}
          >
            <Bone className="aspect-square rounded-none" />
            <div className="space-y-3 p-5">
              <Bone className="h-3 w-20" />
              <Bone className="h-5 w-4/5" />
              <Bone className="h-4 w-1/2" />
              <Bone className="mt-6 h-5 w-24" />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Bone className="h-4 w-40" />
        <div className="flex gap-2">
          <Bone className="h-10 w-20" />
          <Bone className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

export function CatalogDynamicSkeleton() {
  return (
    <>
      <FilterSkeleton />
      <CatalogResultsSkeleton />
    </>
  );
}

export function ProductSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="mt-10" role="status">
      <span className="sr-only">Загрузка товара</span>
      <div className="grid gap-8 rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Bone className="aspect-square rounded-xl" />
        <div className="space-y-4">
          <Bone className="h-3 w-24" />
          <Bone className="h-9 w-4/5" />
          <Bone className="h-4 w-32" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Bone className="h-12 w-full" />
            <Bone className="h-12 w-full" />
          </div>
          <Bone className="mt-6 h-8 w-36" />
          <Bone className="h-11 w-40" />
        </div>
      </div>
    </div>
  );
}

export function AdminListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">Загрузка раздела</span>
      <Bone className="h-7 w-40" />
      <Bone className="mt-2 h-4 w-72 max-w-full" />
      <ul className="mt-8 space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <li className="rounded-2xl border border-line bg-surface p-4" key={index}>
            <div className="flex items-baseline justify-between gap-4">
              <Bone className="h-5 w-1/3" />
              <Bone className="h-4 w-16" />
            </div>
            <Bone className="mt-3 h-4 w-2/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminDetailSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-8" role="status">
      <span className="sr-only">Загрузка карточки</span>
      <Bone className="h-4 w-36" />
      <Bone className="h-7 w-2/3 max-w-md" />
      <Bone className="h-4 w-48" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Bone className="h-24 w-full rounded-2xl" />
        <Bone className="h-24 w-full rounded-2xl" />
      </div>
      <Bone className="h-40 w-full rounded-2xl" />
    </div>
  );
}

export function AdminChromeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 sm:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Bone className="h-3 w-28" />
          <Bone className="mt-2 h-8 w-40" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Bone className="h-9 w-20 rounded-full" key={index} />
          ))}
        </div>
      </div>
      <AdminListSkeleton />
    </div>
  );
}

export function AccountListSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="mt-10 space-y-4" role="status">
      <span className="sr-only">Загрузка</span>
      {Array.from({ length: 3 }, (_, index) => (
        <div className="rounded-2xl border border-line bg-surface p-4" key={index}>
          <Bone className="h-5 w-1/2" />
          <Bone className="mt-3 h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="mt-8 space-y-4" role="status">
      <span className="sr-only">Загрузка формы</span>
      <Bone className="h-10 w-full" />
      <Bone className="h-10 w-full" />
      <Bone className="h-11 w-32" />
    </div>
  );
}
