import { AccountListSkeleton } from "@/components/skeletons";

export default function CheckoutLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:px-10">
      <h1 className="text-3xl font-black tracking-tight text-ink">Оформление заказа</h1>
      <AccountListSkeleton />
    </main>
  );
}
