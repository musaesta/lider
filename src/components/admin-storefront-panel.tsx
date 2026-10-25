import Link from "next/link";
import { adminButtonClass } from "@/components/admin-fields";
import {
  hideProductFromCatalog,
  publishProduct,
} from "@/lib/admin/catalog-actions";

function Step({ done, label }: { done: boolean; label: string }) {
  return (
    <li className={done ? "text-ink" : "text-muted"}>
      {done ? "Готово" : "Ещё нет"} · {label}
    </li>
  );
}

export function AdminStorefrontPanel({
  productId,
  slug,
  isActive,
  hasPhoto,
  hasStock,
  hasVehicle,
  brandPublished,
  categoryPublished,
}: {
  productId: string;
  slug: string;
  isActive: boolean;
  hasPhoto: boolean;
  hasStock: boolean;
  hasVehicle: boolean;
  brandPublished: boolean;
  categoryPublished: boolean;
}) {
  const visibleOnStorefront = isActive && brandPublished && categoryPublished;

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
        Публикация на витрине
      </h3>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        {visibleOnStorefront
          ? "Товар виден покупателям в каталоге."
          : "Это черновик. Пока не нажмёте «Выложить на витрину», в каталоге его не будет."}
      </p>
      <ul className="mt-4 space-y-1 text-sm">
        <Step done label="Карточка сохранена" />
        <Step done={hasPhoto} label="Фото" />
        <Step done={hasStock} label="Остаток" />
        <Step done={hasVehicle} label="Автомобиль (чтобы искать по марке)" />
        <Step done={isActive} label="Выложен на витрину" />
      </ul>
      {!brandPublished ? (
        <p className="mt-3 text-sm text-danger">
          Бренд скрыт. Сначала опубликуйте его в разделе «Бренды».
        </p>
      ) : null}
      {!categoryPublished ? (
        <p className="mt-3 text-sm text-danger">
          Категория скрыта. Сначала опубликуйте её в разделе «Категории».
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {isActive ? (
          <>
            <Link
              className={adminButtonClass}
              href={`/catalog/${slug}`}
            >
              Открыть на витрине
            </Link>
            <form action={hideProductFromCatalog}>
              <input name="productId" type="hidden" value={productId} />
              <button className="text-sm font-medium text-muted underline" type="submit">
                Снять с витрины
              </button>
            </form>
          </>
        ) : (
          <form action={publishProduct}>
            <input name="productId" type="hidden" value={productId} />
            <button className={adminButtonClass} type="submit">
              Выложить на витрину
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
