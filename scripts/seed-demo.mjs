import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applyLocalSql, readLocalSupabaseEnv } from "./local-supabase.mjs";

const root = resolve(import.meta.dirname, "..");

readLocalSupabaseEnv();

console.log("1/4 исходные 3 товара");
applyLocalSql(readFileSync(resolve(root, "supabase/seed-demo-catalog.sql"), "utf8"));

console.log("2/4 каталог ~200 позиций и фото по типам");
execSync("node scripts/seed-demo-catalog-200.mjs", { cwd: root, stdio: "inherit" });

console.log("3/4 фото трёх исходных товаров");
execSync("node scripts/upload-demo-product-images.mjs", { cwd: root, stdio: "inherit" });

console.log("4/4 покупатель и сотрудник");
execSync("node scripts/seed-demo-users.mjs", { cwd: root, stdio: "inherit" });

console.log("готово. Витрина: http://localhost:3000  Админка: http://localhost:3000/admin");
