import Link from "next/link";

export default function CatalogNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16 sm:px-10">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
        Товар не найден
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Такой позиции нет в открытом каталоге, либо она ещё не опубликована.
      </p>
      <Link
        className="mt-8 inline-flex w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
        href="/catalog"
      >
        Вернуться в каталог
      </Link>
    </main>
  );
}
