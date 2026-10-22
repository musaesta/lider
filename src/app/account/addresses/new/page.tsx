import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AddressForm } from "@/components/address-form";
import { loginHref } from "@/lib/auth/paths";
import { getAuthViewer } from "@/lib/auth/session";

async function NewAddressContent() {
  const viewer = await getAuthViewer();

  if (!viewer) {
    redirect(loginHref("/account/addresses/new"));
  }

  return <AddressForm />;
}

export default function NewAddressPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
      <Link
        className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4"
        href="/account/addresses"
      >
        Назад к адресам
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">
        Новый адрес
      </h1>
      <Suspense fallback={<p className="mt-8 text-sm text-slate-500">Загрузка…</p>}>
        <NewAddressContent />
      </Suspense>
    </main>
  );
}
