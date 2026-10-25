import { ProductSkeleton } from "@/components/skeletons";

export default function ProductLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:px-10">
      <div className="h-4 w-36 animate-pulse rounded-lg bg-ink/10" />
      <ProductSkeleton />
    </main>
  );
}
