import {
  LocalSupabaseConfigError,
  MissingFixtureError,
  RLS_EMAILS,
  RLS_IDS,
  blocked,
  createUserClient,
  failed,
  includesId,
  passed,
  runCheck,
  writeDidNotApply,
  writeReturnedRow,
  type RlsOutcome,
} from "./helpers.ts";

export async function runCartsAddressesRlsTests(): Promise<RlsOutcome[]> {
  let customerA;
  let customerB;

  try {
    customerA = await createUserClient(RLS_EMAILS.customerA, RLS_IDS.customerA);
    customerB = await createUserClient(RLS_EMAILS.customerB, RLS_IDS.customerB);
  } catch (error) {
    if (error instanceof LocalSupabaseConfigError) {
      throw error;
    }
    const message = error instanceof MissingFixtureError ? error.message : String(error);
    return [blocked("K0", `Нет тестовых покупателей A/B с UUID фикстуры. ${message}`)];
  }

  const cartA = await customerA.from("carts").select("id, user_id").eq("id", RLS_IDS.cartA);
  const cartB = await customerB.from("carts").select("id, user_id").eq("id", RLS_IDS.cartB);

  if (!includesId(cartA.data, RLS_IDS.cartA) || !includesId(cartB.data, RLS_IDS.cartB)) {
    return [
      blocked(
        "K0",
        "Нет корзин покупателей A и B. Нужны пользователи с фиксированными UUID и секция seed.sql для корзин.",
      ),
    ];
  }

  const results: RlsOutcome[] = [];

  results.push(
    await runCheck("K1", async () => {
      const { data, error } = await customerA
        .from("carts")
        .select("id")
        .in("id", [RLS_IDS.cartA, RLS_IDS.cartB]);

      if (error) {
        return failed("K1", error.message);
      }
      if (!includesId(data, RLS_IDS.cartA) || includesId(data, RLS_IDS.cartB)) {
        return failed("K1", "A видит чужую корзину или не видит свою.");
      }

      const stillB = await customerB.from("carts").select("id").eq("id", RLS_IDS.cartB);
      if (!includesId(stillB.data, RLS_IDS.cartB)) {
        return failed("K1", "Корзина B пропала после чтения A.");
      }
      return passed("K1", "A читает только свою корзину; корзина B на месте.");
    }),
  );

  results.push(
    await runCheck("K2", async () => {
      const { data, error } = await customerA
        .from("cart_items")
        .select("id")
        .in("id", [RLS_IDS.cartItemA, RLS_IDS.cartItemB]);

      if (error) {
        return failed("K2", error.message);
      }
      if (!includesId(data, RLS_IDS.cartItemA) || includesId(data, RLS_IDS.cartItemB)) {
        return failed("K2", "Изоляция позиций корзины нарушена.");
      }
      return passed("K2", "A видит только свою позицию корзины.");
    }),
  );

  results.push(
    await runCheck("K3", async () => {
      const before = await customerB
        .from("cart_items")
        .select("id")
        .eq("cart_id", RLS_IDS.cartB);

      const insertResult = await customerA.from("cart_items").insert({
        id: RLS_IDS.cartItemDenied,
        cart_id: RLS_IDS.cartB,
        product_id: RLS_IDS.productPub,
        quantity: 1,
      }).select("id");

      const after = await customerB
        .from("cart_items")
        .select("id")
        .eq("cart_id", RLS_IDS.cartB);
      const denied = await customerB
        .from("cart_items")
        .select("id")
        .eq("id", RLS_IDS.cartItemDenied);

      const beforeIds = (before.data ?? []).map((row) => row.id).sort().join(",");
      const afterIds = (after.data ?? []).map((row) => row.id).sort().join(",");

      if (writeReturnedRow(insertResult) || includesId(denied.data, RLS_IDS.cartItemDenied)) {
        return failed("K3", "A смог добавить позицию в корзину B.");
      }
      if (!writeDidNotApply(insertResult)) {
        return failed("K3", "Вставка в корзину B не вернула ошибку и не выглядит как отказ.");
      }
      if (beforeIds !== afterIds) {
        return failed("K3", "Состав корзины B изменился.");
      }
      return passed("K3", "A не добавил товар в корзину B; состав B прежний.");
    }),
  );

  results.push(
    await runCheck("K4", async () => {
      const insertResult = await customerA.from("cart_items").insert({
        id: RLS_IDS.cartItemDeniedOff,
        cart_id: RLS_IDS.cartA,
        product_id: RLS_IDS.productOff,
        quantity: 1,
      }).select("id");

      const extra = await customerA
        .from("cart_items")
        .select("id, product_id")
        .eq("id", RLS_IDS.cartItemDeniedOff);

      if (
        writeReturnedRow(insertResult) ||
        includesId(extra.data, RLS_IDS.cartItemDeniedOff)
      ) {
        return failed("K4", "Неактивный товар попал в корзину A.");
      }
      return passed("K4", "A не добавил неактивный товар в свою корзину.");
    }),
  );

  results.push(
    await runCheck("K5", async () => {
      const before = await customerA
        .from("carts")
        .select("user_id")
        .eq("id", RLS_IDS.cartA)
        .maybeSingle();

      const updateResult = await customerA
        .from("carts")
        .update({ user_id: RLS_IDS.customerB })
        .eq("id", RLS_IDS.cartA)
        .select("user_id");

      const after = await customerA
        .from("carts")
        .select("user_id")
        .eq("id", RLS_IDS.cartA)
        .maybeSingle();
      const asB = await customerB.from("carts").select("id").eq("id", RLS_IDS.cartA);

      if (after.data?.user_id !== RLS_IDS.customerA) {
        return failed("K5", "user_id корзины A изменился.");
      }
      if (includesId(asB.data, RLS_IDS.cartA)) {
        return failed("K5", "B видит корзину A после попытки переноса.");
      }
      if (!writeDidNotApply(updateResult) && updateResult.data) {
        return failed("K5", "Обновление user_id вернуло данные.");
      }
      if (before.error) {
        return failed("K5", before.error.message);
      }
      return passed("K5", "A не переназначил корзину покупателю B.");
    }),
  );

  results.push(
    await runCheck("K6", async () => {
      const readB = await customerA
        .from("addresses")
        .select("id")
        .eq("id", RLS_IDS.addressB);
      const updateB = await customerA
        .from("addresses")
        .update({ city: "rls-test-hijack" })
        .eq("id", RLS_IDS.addressB)
        .select("id, city");
      const stillB = await customerB
        .from("addresses")
        .select("id, city")
        .eq("id", RLS_IDS.addressB)
        .maybeSingle();

      if (includesId(readB.data, RLS_IDS.addressB)) {
        return failed("K6", "A прочитал адрес B.");
      }
      if (!writeDidNotApply(updateB)) {
        return failed("K6", "A изменил адрес B.");
      }
      if (!stillB.data || stillB.data.city !== "rls-test-city-b") {
        return failed("K6", "Адрес B изменился или недоступен владельцу.");
      }
      return passed("K6", "A не читает и не меняет адрес B.");
    }),
  );

  results.push(
    await runCheck("K7", async () => {
      const insertResult = await customerA.from("addresses").insert({
        id: RLS_IDS.addressDenied,
        user_id: RLS_IDS.customerB,
        recipient_name: "rls-test-denied",
        phone: "+79990000099",
        country_code: "RU",
        city: "rls-test-denied-city",
        address_line1: "rls-test-denied-line",
      }).select("id");

      const asB = await customerB
        .from("addresses")
        .select("id")
        .eq("id", RLS_IDS.addressDenied);

      if (!writeDidNotApply(insertResult) || includesId(asB.data, RLS_IDS.addressDenied)) {
        return failed("K7", "A создал адрес от имени B.");
      }
      return passed("K7", "A не создал адрес с user_id покупателя B.");
    }),
  );

  results.push(
    await runCheck("K8", async () => {
      const itemBefore = await customerA
        .from("cart_items")
        .select("quantity")
        .eq("id", RLS_IDS.cartItemA)
        .maybeSingle();
      const itemBBefore = await customerB
        .from("cart_items")
        .select("quantity")
        .eq("id", RLS_IDS.cartItemB)
        .maybeSingle();

      if (!itemBefore.data || !itemBBefore.data) {
        return blocked("K8", "Нет позиций корзины A/B.");
      }

      const nextQty = itemBefore.data.quantity === 2 ? 1 : 2;
      const updateOwn = await customerA
        .from("cart_items")
        .update({ quantity: nextQty })
        .eq("id", RLS_IDS.cartItemA)
        .select("id, quantity");

      const itemAfter = await customerA
        .from("cart_items")
        .select("quantity")
        .eq("id", RLS_IDS.cartItemA)
        .maybeSingle();
      const itemBAfter = await customerB
        .from("cart_items")
        .select("quantity")
        .eq("id", RLS_IDS.cartItemB)
        .maybeSingle();

      if (updateOwn.error || itemAfter.data?.quantity !== nextQty) {
        return failed("K8", `A не обновил свою позицию: ${updateOwn.error?.message ?? "quantity"}`);
      }
      if (itemBAfter.data?.quantity !== itemBBefore.data.quantity) {
        return failed("K8", "Количество у B изменилось.");
      }

      await customerA
        .from("cart_items")
        .update({ quantity: itemBefore.data.quantity })
        .eq("id", RLS_IDS.cartItemA);

      return passed("K8", "A меняет свою позицию; позиция B без изменений.");
    }),
  );

  results.push(
    await runCheck("K9", async () => {
      const deleteItem = await customerA
        .from("cart_items")
        .delete()
        .eq("id", RLS_IDS.cartItemB)
        .select("id");
      const deleteAddress = await customerA
        .from("addresses")
        .delete()
        .eq("id", RLS_IDS.addressB)
        .select("id");

      const stillItem = await customerB
        .from("cart_items")
        .select("id")
        .eq("id", RLS_IDS.cartItemB);
      const stillAddress = await customerB
        .from("addresses")
        .select("id")
        .eq("id", RLS_IDS.addressB);

      if (!writeDidNotApply(deleteItem) || !includesId(stillItem.data, RLS_IDS.cartItemB)) {
        return failed("K9", "A удалил позицию корзины B.");
      }
      if (!writeDidNotApply(deleteAddress) || !includesId(stillAddress.data, RLS_IDS.addressB)) {
        return failed("K9", "A удалил адрес B.");
      }
      return passed(
        "K9",
        "A не удаляет чужую позицию корзины и чужой адрес; у B обе строки на месте.",
      );
    }),
  );

  return results;
}
