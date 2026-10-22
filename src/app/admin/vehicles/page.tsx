import { AdminVehicleForm } from "@/components/admin-vehicle-form";
import { listAdminVehicles, vehicleLabel } from "@/lib/admin/queries";

export default async function AdminVehiclesPage() {
  const { vehicles, error } = await listAdminVehicles();

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-950">Автомобили</h2>
      <p className="mt-1 text-sm text-slate-500">
        Эти записи привязываются к товарам в карточке товара.
      </p>
      {error ? (
        <p className="mt-6 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-6 space-y-2 text-sm">
        {vehicles.map((vehicle) => (
          <li className="rounded-xl border border-slate-200 bg-white px-4 py-3" key={vehicle.id}>
            {vehicleLabel(vehicle)}
          </li>
        ))}
      </ul>
      <AdminVehicleForm />
    </section>
  );
}
