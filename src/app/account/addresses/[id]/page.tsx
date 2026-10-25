import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AddressForm } from "@/components/address-form";
import { getMyAddress } from "@/lib/account/addresses";
import { loginHref } from "@/lib/auth/paths";
import { getAuthViewer } from "@/lib/auth/session";

async function EditAddressContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await getAuthViewer();

  if (!viewer) {
    redirect(loginHref(`/account/addresses/${id}`));
  }

  const { address, error } = await getMyAddress(id);

  if (error) {
    return (
      <p className="mt-8 text-sm text-danger" role="alert">
        {error}
      </p>
    );
  }

  if (!address) {
    notFound();
  }

  return <AddressForm address={address} />;
}

export default function EditAddressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
      <Link
        className="text-sm font-medium text-muted underline decoration-silver underline-offset-4"
        href="/account/addresses"
      >
        Назад к адресам
      </Link>
      <h1 className="mt-6 text-3xl font-black tracking-tight text-ink">
        Изменить адрес
      </h1>
      <Suspense fallback={<p className="mt-8 text-sm text-muted">Загрузка адреса…</p>}>
        <EditAddressContent params={params} />
      </Suspense>
    </main>
  );
}
