import { FormSkeleton } from "@/components/skeletons";

export default function LoginLoading() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-black tracking-tight text-ink">Вход</h1>
      <FormSkeleton />
    </main>
  );
}
