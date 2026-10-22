import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = resolve(import.meta.dirname, "..");
const sqlPath = resolve(root, "supabase/seed-demo-catalog-200.sql");
const typePhotoDir = resolve(root, "supabase/seed-images/types");

const typePhotos = {
  "oil-filter": "oil-filter.jpg",
  "air-filter": "air-filter.jpg",
  "cabin-filter": "cabin-filter.jpg",
  pads: "brake-pads.jpg",
  disc: "brake-disc.jpg",
  spark: "spark-plug.jpg",
  oil: "engine-oil.jpg",
  wiper: "wiper.jpg",
  battery: "battery.jpg",
  belt: "belt.jpg",
  shock: "shock.jpg",
  bulb: "bulb.jpg",
  thermo: "thermostat.jpg",
  pump: "water-pump.jpg",
  bearing: "bearing.jpg",
};

function uuid(kind, n) {
  const prefixes = {
    brand: "b1000000",
    category: "b2000000",
    product: "b3000000",
    image: "b3100000",
    vehicle: "b4000000",
    compat: "b4100000",
    xref: "b4200000",
  };
  return `${prefixes[kind]}-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function sql(value) {
  if (value == null) {
    return "null";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}


const existingBrands = {
  Bosch: "a1000000-0000-4000-8000-000000000001",
  "MANN-FILTER": "a1000000-0000-4000-8000-000000000002",
};

const newBrands = [
  ["Mahle", "mahle"],
  ["Febi", "febi"],
  ["Brembo", "brembo"],
  ["NGK", "ngk"],
  ["Denso", "denso"],
  ["Valeo", "valeo"],
  ["Mobil", "mobil"],
  ["Castrol", "castrol"],
  ["Hella", "hella"],
  ["Varta", "varta"],
  ["Gates", "gates"],
  ["Continental", "continental"],
  ["KYB", "kyb"],
  ["Sachs", "sachs"],
  ["SKF", "skf"],
  ["Osram", "osram"],
].map(([name, slug], index) => ({
  id: uuid("brand", index + 1),
  name,
  slug,
}));

const brandId = {
  ...existingBrands,
  ...Object.fromEntries(newBrands.map((brand) => [brand.name, brand.id])),
};

const existingCategories = {
  Фильтры: "a2000000-0000-4000-8000-000000000001",
  "Тормозная система": "a2000000-0000-4000-8000-000000000002",
};

const newCategories = [
  ["Двигатель", "dvigatel", "Прокладки, датчики и расходники мотора", 3],
  ["Зажигание", "zazhiganie", "Свечи и катушки", 4],
  ["Подвеска", "podveska", "Амортизаторы и подшипники", 5],
  ["Масла и жидкости", "masla-i-zhidkosti", "Моторные масла", 6],
  ["Электрика", "elektrika", "Аккумуляторы и лампы", 7],
  ["Стеклоочистители", "stekloochistiteli", "Щётки стеклоочистителя", 8],
  ["Охлаждение", "okhlazhdenie", "Помпы и термостаты", 9],
  ["Ременный привод", "remennyy-privod", "Ремни ГРМ и навесного оборудования", 10],
].map(([name, slug, description, sortOrder], index) => ({
  id: uuid("category", index + 1),
  name,
  slug,
  description,
  sortOrder,
}));

const categoryId = {
  ...existingCategories,
  ...Object.fromEntries(newCategories.map((category) => [category.name, category.id])),
};

const newVehicles = [
  ["Toyota", "RAV4", "XA50", 2019, 2024, "2.0"],
  ["Kia", "Rio", "FB", 2017, 2023, "1.6"],
  ["Hyundai", "Solaris", "HCr", 2017, 2023, "1.6"],
  ["Hyundai", "Creta", "SU2", 2021, 2025, "1.6"],
  ["Volkswagen", "Tiguan", "Mk2", 2017, 2023, "2.0"],
  ["Skoda", "Octavia", "A8", 2020, 2025, "1.4"],
  ["Skoda", "Rapid", "NH", 2017, 2022, "1.6"],
  ["Lada", "Vesta", "GFL", 2015, 2024, "1.6"],
  ["Lada", "Granta", "FL", 2018, 2025, "1.6"],
  ["Renault", "Logan", "L8", 2014, 2022, "1.6"],
  ["Renault", "Duster", "HM", 2015, 2021, "2.0"],
  ["Nissan", "Qashqai", "J11", 2014, 2021, "2.0"],
  ["Mazda", "CX-5", "KF", 2017, 2024, "2.0"],
  ["BMW", "3 Series", "G20", 2019, 2024, "2.0"],
  ["Ford", "Focus", "Mk4", 2018, 2024, "1.5"],
  ["Honda", "Civic", "FK", 2017, 2021, "1.5"],
].map((row, index) => ({
  id: uuid("vehicle", index + 1),
  make: row[0],
  model: row[1],
  generation: row[2],
  yearFrom: row[3],
  yearTo: row[4],
  engine: row[5],
}));

const allVehicles = [
  {
    id: "a4000000-0000-4000-8000-000000000001",
    make: "Toyota",
    model: "Camry",
    engine: "2.5",
  },
  {
    id: "a4000000-0000-4000-8000-000000000002",
    make: "Volkswagen",
    model: "Polo",
    engine: "1.6",
  },
  ...newVehicles,
];

function carLabel(vehicle) {
  return `${vehicle.make} ${vehicle.model} ${vehicle.engine}`;
}

function slugPart(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function articleFor(brand, type, n) {
  const seq = String(1100 + n);
  if (brand === "MANN-FILTER") {
    const prefix = type === "air-filter" ? "C" : type === "cabin-filter" ? "CU" : "W";
    return `${prefix} ${seq}/${10 + (n % 80)}`;
  }
  if (brand === "Bosch") {
    const family = {
      "oil-filter": "451 103",
      "air-filter": "986 604",
      "cabin-filter": "986 628",
      pads: "986 494",
      disc: "986 479",
      spark: "242 229",
      wiper: "339 700",
      battery: "009 402",
      bulb: "198 730",
    }[type];
    return `0 ${family} ${seq}`;
  }
  if (brand === "NGK") {
    return `BKR${seq}`;
  }
  if (brand === "Denso") {
    return `K20TT-${seq}`;
  }
  return `${brand.slice(0, 3).toUpperCase()}-${type.slice(0, 2).toUpperCase()}${seq}`;
}

const batches = [
  { type: "oil-filter", count: 22, brands: ["Bosch", "MANN-FILTER", "Mahle", "Febi"], category: "Фильтры", title: "Масляный фильтр", sku: "of", min: 520, max: 1680, text: "Масляный фильтр для плановой замены масла." },
  { type: "air-filter", count: 16, brands: ["MANN-FILTER", "Bosch", "Mahle"], category: "Фильтры", title: "Воздушный фильтр", sku: "af", min: 740, max: 2380, text: "Воздушный фильтр двигателя." },
  { type: "cabin-filter", count: 16, brands: ["MANN-FILTER", "Bosch", "Valeo"], category: "Фильтры", title: "Салонный фильтр", sku: "cf", min: 690, max: 2190, text: "Салонный фильтр с угольным слоем." },
  { type: "pads", count: 22, brands: ["Bosch", "Brembo", "Febi"], category: "Тормозная система", title: "Тормозные колодки", sku: "bp", min: 2490, max: 8690, text: "Комплект колодок на одну ось." },
  { type: "disc", count: 16, brands: ["Brembo", "Bosch", "Febi"], category: "Тормозная система", title: "Тормозной диск", sku: "bd", min: 3190, max: 9890, text: "Вентилируемый тормозной диск." },
  { type: "spark", count: 18, brands: ["NGK", "Denso", "Bosch"], category: "Зажигание", title: "Свеча зажигания", sku: "sp", min: 290, max: 980, text: "Свеча зажигания, цена за штуку." },
  { type: "oil", count: 16, brands: ["Mobil", "Castrol"], category: "Масла и жидкости", title: "Моторное масло", sku: "eo", min: 1890, max: 6290, text: "Синтетическое моторное масло, канистра 4 л." },
  { type: "wiper", count: 14, brands: ["Bosch", "Valeo", "Hella"], category: "Стеклоочистители", title: "Щётка стеклоочистителя", sku: "wb", min: 490, max: 1890, text: "Бескаркасная щётка. Длина по автомобилю." },
  { type: "battery", count: 10, brands: ["Bosch", "Varta"], category: "Электрика", title: "Аккумулятор 12В", sku: "bt", min: 5890, max: 15490, text: "Аккумулятор 12 В, обратная полярность." },
  { type: "belt", count: 12, brands: ["Gates", "Continental"], category: "Ременный привод", title: "Ремень ГРМ", sku: "tb", min: 1290, max: 4290, text: "Ремень газораспределительного механизма." },
  { type: "shock", count: 10, brands: ["KYB", "Sachs"], category: "Подвеска", title: "Амортизатор", sku: "sh", min: 3990, max: 11290, text: "Газомасляный амортизатор." },
  { type: "bulb", count: 8, brands: ["Hella", "Osram", "Bosch"], category: "Электрика", title: "Лампа H7", sku: "lb", min: 180, max: 890, text: "Галогенная лампа H7." },
  { type: "thermo", count: 6, brands: ["Gates", "Febi", "Valeo"], category: "Охлаждение", title: "Термостат", sku: "th", min: 980, max: 3190, text: "Термостат системы охлаждения." },
  { type: "pump", count: 6, brands: ["Gates", "SKF", "Febi"], category: "Охлаждение", title: "Помпа", sku: "wp", min: 2890, max: 8290, text: "Водяной насос системы охлаждения." },
  { type: "bearing", count: 5, brands: ["SKF", "Febi"], category: "Подвеска", title: "Ступичный подшипник", sku: "hb", min: 1590, max: 4990, text: "Подшипник ступицы переднего колеса." },
];

const extraByType = {
  pads: (i) => (i % 2 === 0 ? "передние" : "задние"),
  shock: (i) => (i % 2 === 0 ? "передний" : "задний"),
  battery: (i) => ["60Ah", "70Ah", "74Ah", "80Ah", "90Ah", "45Ah", "55Ah", "62Ah", "65Ah", "100Ah"][i],
  wiper: (i) => `${450 + (i % 8) * 50} мм`,
  bulb: (i) => (i % 2 === 0 ? "H7 55W" : "H4 60/55W"),
  oil: (i) => ["5W-40 4л", "5W-30 4л", "0W-20 4л", "5W-40 1л"][i % 4],
};

const products = [];
const images = [];
const inventory = [];
const compat = [];
const xrefs = [];
const usedKeys = new Set([
  "oil-filter|Bosch|a4000000-0000-4000-8000-000000000001|",
  "air-filter|MANN-FILTER|a4000000-0000-4000-8000-000000000001|",
  "pads|Bosch|a4000000-0000-4000-8000-000000000002|",
]);
let productNo = 0;
let imageNo = 0;
let compatNo = 0;
let xrefNo = 0;

for (const batch of batches) {
  for (let i = 0; i < batch.count; i += 1) {
    productNo += 1;
    const brandName = batch.brands[i % batch.brands.length];
    let extra = extraByType[batch.type]?.(i) ?? "";
    let vehicleIndex = i % allVehicles.length;
    let key = `${batch.type}|${brandName}|${allVehicles[vehicleIndex].id}|${extra}`;
    let guard = 0;
    while (usedKeys.has(key) && guard < allVehicles.length) {
      vehicleIndex = (vehicleIndex + 1) % allVehicles.length;
      key = `${batch.type}|${brandName}|${allVehicles[vehicleIndex].id}|${extra}`;
      guard += 1;
    }
    if (usedKeys.has(key)) {
      extra = extra ? `${extra} OEM` : "OEM";
      key = `${batch.type}|${brandName}|${allVehicles[vehicleIndex].id}|${extra}`;
    }
    usedKeys.add(key);
    const vehicle = allVehicles[vehicleIndex];
    const extraLabel = extra || null;
    const article = articleFor(brandName, batch.type, productNo);
    const sku = `${brandName.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 8)}-${batch.sku.toUpperCase()}-${productNo}`;
    const slug = `${batch.sku}-${slugPart(brandName)}-${productNo}-${slugPart(vehicle.make)}-${slugPart(vehicle.model)}`;
    const name = extraLabel
      ? `${batch.title} ${brandName} ${extraLabel} ${article} — ${carLabel(vehicle)}`
      : `${batch.title} ${brandName} ${article} — ${carLabel(vehicle)}`;
    const price = batch.min + ((productNo * 97 + i * 41) % (batch.max - batch.min));
    const id = uuid("product", productNo);
    const photoFile = typePhotos[batch.type];
    if (!photoFile) {
      throw new Error(`No type photo for ${batch.type}`);
    }
    const storagePath = `products/types/${photoFile}`;

    products.push({
      id,
      sku,
      article,
      slug,
      name,
      description: `${batch.text} Артикул ${article}. Подходит: ${carLabel(vehicle)}.`,
      brandId: brandId[brandName],
      categoryId: categoryId[batch.category],
      price,
    });

    imageNo += 1;
    images.push({
      id: uuid("image", imageNo),
      productId: id,
      storagePath,
      alt: name,
    });

    inventory.push({
      productId: id,
      quantity: i % 9 === 0 ? 0 : 2 + ((i * 7) % 18),
    });

    compatNo += 1;
    compat.push({
      id: uuid("compat", compatNo),
      productId: id,
      vehicleId: vehicle.id,
    });

    if (productNo % 5 === 0) {
      const otherBrand = batch.brands[(i + 1) % batch.brands.length];
      if (otherBrand !== brandName) {
        xrefNo += 1;
        xrefs.push({
          id: uuid("xref", xrefNo),
          productId: id,
          brandId: brandId[otherBrand],
          article: `XR ${articleFor(otherBrand, batch.type, productNo + 800)}`,
        });
      }
    }
  }
}

if (products.length !== 197) {
  throw new Error(`Expected 197 new products, got ${products.length}`);
}

const names = new Set(products.map((product) => product.name));
if (names.size !== products.length) {
  throw new Error("Generated catalog has duplicate names.");
}

const statements = [
  "-- Демо-каталог ~200 уникальных позиций. Это не миграция и не облачный seed.",
  "-- Не запускать на удалённой базе. Не трогает RLS-фикстуры rls-test-*.",
  "",
  "delete from public.cart_items",
  "where product_id in (select id from public.products where id::text like 'b3000000%');",
  "",
  "delete from public.inventory",
  "where product_id::text like 'b3000000%';",
  "",
  "delete from public.products",
  "where id::text like 'b3000000%';",
  "",
  "update public.products",
  "set name = 'Масляный фильтр Bosch — Toyota Camry 2.5'",
  "where id = 'a3000000-0000-4000-8000-000000000001';",
  "update public.products",
  "set name = 'Воздушный фильтр MANN-FILTER — Toyota Camry 2.5'",
  "where id = 'a3000000-0000-4000-8000-000000000002';",
  "update public.products",
  "set name = 'Тормозные колодки Bosch — Volkswagen Polo 1.6'",
  "where id = 'a3000000-0000-4000-8000-000000000003';",
  "",
  "insert into public.brands (id, name, slug, is_published) values",
  newBrands
    .map((brand, index) => `  (${sql(brand.id)}, ${sql(brand.name)}, ${sql(brand.slug)}, true)${index === newBrands.length - 1 ? "" : ","}`)
    .join("\n"),
  "on conflict (id) do nothing;",
  "",
  "insert into public.categories (id, parent_id, name, slug, description, sort_order, is_published) values",
  newCategories
    .map(
      (category, index) =>
        `  (${sql(category.id)}, null, ${sql(category.name)}, ${sql(category.slug)}, ${sql(category.description)}, ${category.sortOrder}, true)${index === newCategories.length - 1 ? "" : ","}`,
    )
    .join("\n"),
  "on conflict (id) do nothing;",
  "",
  "insert into public.vehicles (id, make, model, generation, year_from, year_to, engine) values",
  newVehicles
    .map(
      (vehicle, index) =>
        `  (${sql(vehicle.id)}, ${sql(vehicle.make)}, ${sql(vehicle.model)}, ${sql(vehicle.generation)}, ${vehicle.yearFrom}, ${vehicle.yearTo}, ${sql(vehicle.engine)})${index === newVehicles.length - 1 ? "" : ","}`,
    )
    .join("\n"),
  "on conflict (id) do nothing;",
  "",
  "insert into public.products (id, sku, article, slug, name, description, brand_id, category_id, price, is_active) values",
  products
    .map(
      (product, index) =>
        `  (${sql(product.id)}, ${sql(product.sku)}, ${sql(product.article)}, ${sql(product.slug)}, ${sql(product.name)}, ${sql(product.description)}, ${sql(product.brandId)}, ${sql(product.categoryId)}, ${product.price.toFixed(2)}, true)${index === products.length - 1 ? "" : ","}`,
    )
    .join("\n"),
  "on conflict (id) do nothing;",
  "",
  "insert into public.product_images (id, product_id, storage_path, alt_text, sort_order) values",
  images
    .map(
      (image, index) =>
        `  (${sql(image.id)}, ${sql(image.productId)}, ${sql(image.storagePath)}, ${sql(image.alt)}, 0)${index === images.length - 1 ? "" : ","}`,
    )
    .join("\n"),
  "on conflict (id) do nothing;",
  "",
  "insert into public.inventory (product_id, quantity_on_hand, quantity_reserved) values",
  inventory
    .map(
      (row, index) =>
        `  (${sql(row.productId)}, ${row.quantity}, 0)${index === inventory.length - 1 ? "" : ","}`,
    )
    .join("\n"),
  "on conflict (product_id) do nothing;",
  "",
  "insert into public.product_compatibility (id, product_id, vehicle_id) values",
  compat
    .map(
      (row, index) =>
        `  (${sql(row.id)}, ${sql(row.productId)}, ${sql(row.vehicleId)})${index === compat.length - 1 ? "" : ","}`,
    )
    .join("\n"),
  "on conflict (id) do nothing;",
  "",
  "insert into public.product_cross_references (id, product_id, brand_id, article) values",
  xrefs
    .map(
      (row, index) =>
        `  (${sql(row.id)}, ${sql(row.productId)}, ${sql(row.brandId)}, ${sql(row.article)})${index === xrefs.length - 1 ? "" : ","}`,
    )
    .join("\n"),
  "on conflict (id) do nothing;",
  "",
];

writeFileSync(sqlPath, `${statements.join("\n")}\n`);
console.log(`wrote ${products.length} unique products to ${sqlPath}`);

function statusEnv() {
  const status = execSync("npx supabase status -o env", {
    cwd: root,
    encoding: "utf8",
  });
  return Object.fromEntries(
    status
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        let value = line.slice(index + 1);
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [line.slice(0, index), value];
      }),
  );
}

execSync("docker exec -i supabase_db_lider psql -U postgres -d postgres -v ON_ERROR_STOP=1", {
  cwd: root,
  input: `${statements.join("\n")}\n`,
  stdio: ["pipe", "inherit", "inherit"],
});

const values = statusEnv();
const url = values.API_URL;
const serviceKey = values.SERVICE_ROLE_KEY || values.SECRET_KEY;

if (!url || !serviceKey) {
  throw new Error("Local Supabase status did not include API_URL and a service key.");
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const fileName of Object.values(typePhotos)) {
  const objectPath = `products/types/${fileName}`;
  const body = readFileSync(resolve(typePhotoDir, fileName));
  const { error } = await supabase.storage.from("product-images").upload(objectPath, body, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) {
    throw new Error(`Upload failed for ${objectPath}: ${error.message}`);
  }
  console.log(`uploaded ${objectPath}`);
}

const count = execSync(
  "docker exec -i supabase_db_lider psql -U postgres -d postgres -tAc \"select count(*) from public.products where sku not ilike 'RLS-TEST%'; select count(distinct name) from public.products where sku not ilike 'RLS-TEST%'; select count(distinct storage_path) from public.product_images where storage_path not like 'rls-test%';\"",
  { encoding: "utf8" },
).trim();

console.log(`catalog products / unique names / photo files:\n${count}`);
