import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { assertCloudApiUrl } from "./cloud-supabase.mjs";

const root = resolve(import.meta.dirname, "..");

if (process.env.LIDER_SEED_CLOUD !== "yes") {
  throw new Error("Облачные фото только с LIDER_SEED_CLOUD=yes.");
}

const url = assertCloudApiUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!publishableKey) {
  throw new Error("Нужен NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY облачного проекта.");
}

const supabase = createClient(url, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error: signInError } = await supabase.auth.signInWithPassword({
  email: "shop-staff@lider.local",
  password: "ShopStaff123",
});

if (signInError) {
  throw new Error(`Не удалось войти сотрудником: ${signInError.message}`);
}

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

console.log("облачные фото готовы");
