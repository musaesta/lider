import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = resolve(import.meta.dirname, "..");
const status = execSync("npx supabase status -o env", {
  cwd: root,
  encoding: "utf8",
});

const values = Object.fromEntries(
  status
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      const key = line.slice(0, index);
      let value = line.slice(index + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return [key, value];
    }),
);

const url = values.API_URL;
const serviceKey = values.SERVICE_ROLE_KEY || values.SECRET_KEY;

if (!url || !serviceKey) {
  throw new Error("Local Supabase status did not include API_URL and a service key.");
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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
