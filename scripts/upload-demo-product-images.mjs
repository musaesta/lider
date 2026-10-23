import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createLocalServiceClient } from "./local-supabase.mjs";

const root = resolve(import.meta.dirname, "..");
const supabase = createLocalServiceClient();

const files = [
  "maslyanyy-filtr-bosch-0451103316.jpg",
  "vozdushnyy-filtr-mann-c3698.jpg",
  "tormoznye-kolodki-bosch-0986494070.jpg",
];

for (const fileName of files) {
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
