import { AdminVehicleForm } from "@/components/admin-vehicle-form";
import { listAdminVehicles, vehicleLabel } from "@/lib/admin/queries";

export default async function AdminVehiclesPage() {
  const { vehicles, error } = await listAdminVehicles();

  return (
    <section>
      <h2 className="text-xl font-semibold text-ink">Автомобили</h2>
      <p className="mt-1 text-sm text-muted">
        Эти записи привязываются к товарам в карточке товара.
      </p>
      {error ? (
        <p className="mt-6 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-6 space-y-2 text-sm">
        {vehicles.map((vehicle) => (
          <li className="rounded-xl border border-line bg-surface px-4 py-3" key={vehicle.id}>
            {vehicleLabel(vehicle)}
          </li>
        ))}
      </ul>
      <AdminVehicleForm />
    </section>
  );
}
