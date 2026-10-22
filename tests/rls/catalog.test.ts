import {
  RLS_EMAILS,
  RLS_IDS,
  blocked,
  createAnonClient,
  createUserClient,
  failed,
  idsOf,
  includesId,
  isAccessDeniedError,
  passed,
  runCheck,
  type RlsOutcome,
} from "./helpers.ts";

/**
 * Каталог для гостя. Не запускается сам.
 * Позднее: после согласия на способ запуска вызвать runCatalogRlsTests().
 */
export async function runCatalogRlsTests(): Promise<RlsOutcome[]> {
  const anon = createAnonClient();

  const publicProduct = await anon
    .from("products")
    .select("id")
    .eq("id", RLS_IDS.productPub);

  if (publicProduct.error) {
    return [
      blocked(
        "C0",
        `Не удалось прочитать products как гость: ${publicProduct.error.message}. Фикстуры или API недоступны.`,
      ),
    ];
  }

  if (!includesId(publicProduct.data, RLS_IDS.productPub)) {
    return [
      blocked(
        "C0",
        "Нет публичного товара rls-test-product-pub. Сначала нужны фикстуры из seed.sql. Это не результат RLS.",
      ),
    ];
  }

  let staff = null as ReturnType<typeof createAnonClient> | null;
  let staffError: string | null = null;

  try {
    staff = await createUserClient(RLS_EMAILS.operator, RLS_IDS.operator);
  } catch (error) {
    staffError = error instanceof Error ? error.message : String(error);
  }

  const hiddenProductIds = [
    RLS_IDS.productOff,
    RLS_IDS.productBrandHid,
    RLS_IDS.productCatHid,
  ];

  const results: RlsOutcome[] = [];

  results.push(
    await runCheck("C1", async () => {
      const { data, error } = await anon
        .from("brands")
        .select("id")
        .in("id", [RLS_IDS.brandPub, RLS_IDS.brandHid]);

      if (error) {
        return failed("C1", `Ошибка чтения brands: ${error.message}`);
      }

      const ids = idsOf(data);
      if (!ids.includes(RLS_IDS.brandPub)) {
        return failed("C1", "Гость не видит опубликованный бренд.");
      }
      if (ids.includes(RLS_IDS.brandHid)) {
        return failed("C1", "Гость видит неопубликованный бренд.");
      }
      if (!staff) {
        return blocked(
          "C1",
          `Гость видит только опубликованный бренд, но скрытый бренд в базе не подтверждён сотрудником. ${staffError}`,
        );
      }

      const hidden = await staff
        .from("brands")
        .select("id")
        .eq("id", RLS_IDS.brandHid);
      if (hidden.error) {
        return failed("C1", `Сотрудник не прочитал скрытый бренд: ${hidden.error.message}`);
      }
      if (!includesId(hidden.data, RLS_IDS.brandHid)) {
        return blocked("C1", "Скрытый бренд отсутствует в фикстурах.");
      }
      return passed("C1", "Гость видит только опубликованный бренд; скрытый есть у сотрудника.");
    }),
  );

  results.push(
    await runCheck("C2", async () => {
      const { data, error } = await anon
        .from("categories")
        .select("id")
        .in("id", [RLS_IDS.categoryPub, RLS_IDS.categoryHid]);

      if (error) {
        return failed("C2", `Ошибка чтения categories: ${error.message}`);
      }

      const ids = idsOf(data);
      if (!ids.includes(RLS_IDS.categoryPub) || ids.includes(RLS_IDS.categoryHid)) {
        return failed("C2", "Видимость категорий не совпала с политикой.");
      }
      if (!staff) {
        return blocked("C2", `Скрытая категория не подтверждена сотрудником. ${staffError}`);
      }

      const hidden = await staff
        .from("categories")
        .select("id")
        .eq("id", RLS_IDS.categoryHid);
      if (!includesId(hidden.data, RLS_IDS.categoryHid)) {
        return blocked("C2", "Скрытая категория отсутствует в фикстурах.");
      }
      return passed("C2", "Гость видит только опубликованную категорию.");
    }),
  );

  results.push(
    await runCheck("C3", async () => {
      const { data, error } = await anon
        .from("products")
        .select("id")
        .in("id", [RLS_IDS.productPub, ...hiddenProductIds]);

      if (error) {
        return failed("C3", `Ошибка чтения products: ${error.message}`);
      }

      const ids = idsOf(data);
      if (ids.length !== 1 || ids[0] !== RLS_IDS.productPub) {
        return failed("C3", `Гость увидел товары: ${ids.join(", ") || "(ничего)"}`);
      }
      if (!staff) {
        return blocked("C3", `Скрытые товары не подтверждены сотрудником. ${staffError}`);
      }

      const hidden = await staff
        .from("products")
        .select("id")
        .in("id", hiddenProductIds);
      const hiddenIds = idsOf(hidden.data);
      const missing = hiddenProductIds.filter((id) => !hiddenIds.includes(id));
      if (hidden.error) {
        return failed("C3", hidden.error.message);
      }
      if (missing.length > 0) {
        return blocked("C3", `В фикстурах нет скрытых товаров: ${missing.join(", ")}`);
      }
      return passed("C3", "Гость видит только активный товар в опубликованном каталоге.");
    }),
  );

  results.push(
    await runCheck("C4", async () => {
      const { data, error } = await anon
        .from("product_images")
        .select("id")
        .in("id", [RLS_IDS.imagePub, RLS_IDS.imageOff]);

      if (error) {
        return failed("C4", error.message);
      }
      const ids = idsOf(data);
      if (!ids.includes(RLS_IDS.imagePub) || ids.includes(RLS_IDS.imageOff)) {
        return failed("C4", "Видимость картинок не совпала с политикой.");
      }
      if (!staff) {
        return blocked("C4", `Картинка неактивного товара не подтверждена. ${staffError}`);
      }
      const hidden = await staff
        .from("product_images")
        .select("id")
        .eq("id", RLS_IDS.imageOff);
      if (!includesId(hidden.data, RLS_IDS.imageOff)) {
        return blocked("C4", "Нет фикстуры картинки неактивного товара.");
      }
      return passed("C4", "Гость видит только картинку публичного товара.");
    }),
  );

  results.push(
    await runCheck("C5", async () => {
      const compatibility = await anon
        .from("product_compatibility")
        .select("id")
        .in("id", [RLS_IDS.compatibilityPub, RLS_IDS.compatibilityOff]);
      const xrefs = await anon
        .from("product_cross_references")
        .select("id")
        .in("id", [RLS_IDS.xrefPub, RLS_IDS.xrefOff]);

      if (compatibility.error) {
        return failed("C5", compatibility.error.message);
      }
      if (xrefs.error) {
        return failed("C5", xrefs.error.message);
      }
      if (
        !includesId(compatibility.data, RLS_IDS.compatibilityPub) ||
        includesId(compatibility.data, RLS_IDS.compatibilityOff) ||
        !includesId(xrefs.data, RLS_IDS.xrefPub) ||
        includesId(xrefs.data, RLS_IDS.xrefOff)
      ) {
        return failed("C5", "Видимость совместимости или кроссов не совпала с политикой.");
      }
      if (!staff) {
        return blocked("C5", `Скрытые связи не подтверждены сотрудником. ${staffError}`);
      }

      const hiddenCompat = await staff
        .from("product_compatibility")
        .select("id")
        .eq("id", RLS_IDS.compatibilityOff);
      const hiddenXref = await staff
        .from("product_cross_references")
        .select("id")
        .eq("id", RLS_IDS.xrefOff);

      if (hiddenCompat.error || hiddenXref.error) {
        return failed("C5", "Сотрудник не прочитал скрытые совместимость или кроссы.");
      }
      if (
        !includesId(hiddenCompat.data, RLS_IDS.compatibilityOff) ||
        !includesId(hiddenXref.data, RLS_IDS.xrefOff)
      ) {
        return blocked("C5", "Нет фикстур скрытой совместимости или кросса.");
      }
      return passed("C5", "Гость видит совместимость и кроссы только публичного товара.");
    }),
  );

  results.push(
    await runCheck("C6", async () => {
      const { data, error } = await anon
        .from("vehicles")
        .select("id")
        .eq("id", RLS_IDS.vehicle);

      if (error) {
        return failed("C6", error.message);
      }
      if (!includesId(data, RLS_IDS.vehicle)) {
        return blocked("C6", "Нет фикстуры автомобиля rls-test-make.");
      }
      return passed("C6", "Гость читает vehicles — в политике select using (true).");
    }),
  );

  results.push(
    await runCheck("C7", async () => {
      const tablesWithId = ["profiles", "carts", "orders", "payments"] as const;

      for (const table of tablesWithId) {
        const { data, error } = await anon.from(table).select("id").limit(1);

        if (error) {
          if (!isAccessDeniedError(error)) {
            return failed(
              "C7",
              `Гостевой запрос к ${table} завершился неожиданной ошибкой, а не отказом доступа.`,
            );
          }
          continue;
        }

        if ((data ?? []).length > 0) {
          return failed("C7", `Гость прочитал строки из ${table}.`);
        }

        return failed(
          "C7",
          `Гость получил пустой ответ из ${table} без ошибки доступа. Это не считается отказом RLS/GRANT.`,
        );
      }

      const inventory = await anon
        .from("inventory")
        .select("product_id, quantity_on_hand, quantity_reserved")
        .eq("product_id", RLS_IDS.productPub);

      if (inventory.error) {
        if (!isAccessDeniedError(inventory.error)) {
          return failed(
            "C7",
            "Гостевой запрос к inventory завершился неожиданной ошибкой, а не отказом доступа.",
          );
        }
      } else if (
        (inventory.data ?? []).some((row) => row.product_id === RLS_IDS.productPub)
      ) {
        return failed("C7", "Гость прочитал inventory.");
      } else {
        return failed(
          "C7",
          "Гость получил пустой inventory без ошибки доступа. Это не считается отказом RLS/GRANT.",
        );
      }

      return passed(
        "C7",
        "Гость получает отказ доступа к profiles, carts, orders, payments и inventory.",
      );
    }),
  );

  return results;
}
