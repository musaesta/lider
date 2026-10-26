import { AdminDetailSkeleton } from "@/components/skeletons";

export default function OrderLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16 sm:px-10">
      <AdminDetailSkeleton />
    </main>
  );
}
