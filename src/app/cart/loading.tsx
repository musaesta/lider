import { AccountListSkeleton } from "@/components/skeletons";

export default function CartLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16 sm:px-10">
      <h1 className="text-3xl font-black tracking-tight text-ink">Корзина</h1>
      <AccountListSkeleton />
    </main>
  );
}
