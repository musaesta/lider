import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteAddress } from "@/lib/account/address-actions";
import { formatAddress, listMyAddresses } from "@/lib/account/addresses";
import { loginHref } from "@/lib/auth/paths";
import { getAuthViewer } from "@/lib/auth/session";

async function AddressesContent() {
  const viewer = await getAuthViewer();

  if (!viewer) {
    redirect(loginHref("/account/addresses"));
  }

  const { addresses, error } = await listMyAddresses();

  if (error) {
    return (
      <p className="mt-10 text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }

  if (addresses.length === 0) {
    return (
      <p className="mt-10 text-sm leading-6 text-slate-500">
        Адресов пока нет.{" "}
        <Link className="font-medium text-slate-900 underline" href="/account/addresses/new">
          Добавить первый
        </Link>
      </p>
    );
  }

  return (
    <ul className="mt-10 space-y-4">
      {addresses.map((address) => (
        <li
          className="rounded-2xl border border-slate-200/80 bg-white p-5"
          key={address.id}
        >
          <p className="font-medium text-slate-950">
            {address.recipientName}, {address.phone}
          </p>
          <p className="mt-1 text-sm text-slate-500">{formatAddress(address)}</p>
          <div className="mt-4 flex gap-4 text-sm">
            <Link className="font-medium text-slate-700 underline" href={`/account/addresses/${address.id}`}>
              Изменить
            </Link>
            <form action={deleteAddress}>
              <input name="addressId" type="hidden" value={address.id} />
              <button className="font-medium text-red-600" type="submit">
                Удалить
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AddressesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Адреса</h1>
          <p className="mt-2 text-sm text-slate-500">
            Эти адреса используются при оформлении заказа. Доставка пока ручная.
          </p>
        </div>
        <Link
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
          href="/account/addresses/new"
        >
          Добавить адрес
        </Link>
      </div>
      <Suspense fallback={<p className="mt-10 text-sm text-slate-500">Загрузка адресов…</p>}>
        <AddressesContent />
      </Suspense>
    </main>
  );
}
