import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  applyCloudSql,
  createCloudServiceClient,
  readCloudKeys,
  readLinkedProjectRef,
} from "./cloud-supabase.mjs";

const root = resolve(import.meta.dirname, "..");

if (process.env.LIDER_SEED_CLOUD !== "yes") {
  throw new Error("Облачный сид только с LIDER_SEED_CLOUD=yes. Локальный: npm run seed:demo.");
}

const projectRef = readLinkedProjectRef();
const { url } = readCloudKeys(projectRef);
const supabase = createCloudServiceClient(projectRef);

console.log(`облачный проект ${projectRef} (${url})`);

console.log("1/4 исходные 3 товара");
applyCloudSql(resolve(root, "supabase/seed-demo-catalog.sql"));

console.log("2/4 каталог ~200 позиций");
applyCloudSql(resolve(root, "supabase/seed-demo-catalog-200.sql"));

console.log("3/4 фото");
const originals = [
  "maslyanyy-filtr-bosch-0451103316.jpg",
  "vozdushnyy-filtr-mann-c3698.jpg",
  "tormoznye-kolodki-bosch-0986494070.jpg",
];

for (const fileName of originals) {
  const objectPath = `products/${fileName}`;
  const body = readFileSync(resolve(root, "supabase/seed-images", fileName));
  const { error } = await supabase.storage.from("product-images").upload(objectPath, body, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) {
    throw new Error(`Upload failed for ${objectPath}: ${error.message}`);
  }
  console.log(`uploaded ${objectPath}`);
}

const typeDir = resolve(root, "supabase/seed-images/types");
for (const fileName of readdirSync(typeDir).filter((name) => name.endsWith(".jpg"))) {
  const objectPath = `products/types/${fileName}`;
  const body = readFileSync(resolve(typeDir, fileName));
  const { error } = await supabase.storage.from("product-images").upload(objectPath, body, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) {
    throw new Error(`Upload failed for ${objectPath}: ${error.message}`);
  }
  console.log(`uploaded ${objectPath}`);
}

console.log("4/4 покупатель и сотрудник");

const DEMO_USERS = [
  {
    email: "shop-buyer@lider.local",
    password: "ShopTest123",
    role: "customer",
    displayName: "Муса",
    phone: "+79000000000",
  },
  {
    email: "shop-staff@lider.local",
    password: "ShopStaff123",
    role: "operator",
    displayName: "Сотрудник",
    phone: "+79000000001",
  },
];

async function findUserByEmail(email) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`Не удалось прочитать пользователей: ${error.message}`);
    }
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      return found;
    }
    if (data.users.length < 200) {
      return null;
    }
    page += 1;
  }
  return null;
}

const ids = {};

for (const demo of DEMO_USERS) {
  const existing = await findUserByEmail(demo.email);
  let userId = existing?.id ?? null;

  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: demo.password,
      email_confirm: true,
      user_metadata: { display_name: demo.displayName },
    });
    if (error) {
      throw new Error(`Не удалось обновить ${demo.email}: ${error.message}`);
    }
    console.log(`updated ${demo.email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: demo.email,
      password: demo.password,
      email_confirm: true,
      user_metadata: { display_name: demo.displayName },
    });
    if (error || !data.user) {
      throw new Error(`Не удалось создать ${demo.email}: ${error?.message ?? "нет id"}`);
    }
    userId = data.user.id;
    console.log(`created ${demo.email}`);
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: demo.displayName,
      phone: demo.phone,
      role: demo.role,
    },
    { onConflict: "id" },
  );
  if (profileError) {
    throw new Error(`Не удалось записать профиль ${demo.email}: ${profileError.message}`);
  }
  ids[demo.role] = userId;
}

const { error: addressError } = await supabase.from("addresses").upsert(
  {
    id: "c6000000-0000-4000-8000-000000000001",
    user_id: ids.customer,
    recipient_name: "Муса",
    phone: "+79000000000",
    country_code: "RU",
    region: "Москва",
    city: "Москва",
    postal_code: "101000",
    address_line1: "Тверская, 1",
  },
  { onConflict: "id" },
);

if (addressError) {
  throw new Error(`Не удалось записать адрес покупателя: ${addressError.message}`);
}

console.log("облачный демо-сид готов");
