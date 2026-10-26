import { AccountListSkeleton } from "@/components/skeletons";

export default function AddressesLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
      <h1 className="text-3xl font-black tracking-tight text-ink">Адреса</h1>
      <AccountListSkeleton />
    </main>
  );
}
