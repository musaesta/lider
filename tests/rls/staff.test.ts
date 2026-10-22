import {
  LocalSupabaseConfigError,
  MissingFixtureError,
  RLS_EMAILS,
  RLS_IDS,
  blocked,
  createUserClient,
  failed,
  idsOf,
  includesId,
  passed,
  runCheck,
  writeDidNotApply,
  writeReturnedRow,
  type RlsOutcome,
} from "./helpers.ts";

/**
 * Права operator/admin и запрет доступа к чужим корзинам/адресам.
 * operator и admin в текущих политиках одинаковы (private.is_staff).
 * Не запускается сам.
 */
export async function runStaffRlsTests(): Promise<RlsOutcome[]> {
  let operator;
  let admin;
  let customerA;

  try {
    operator = await createUserClient(RLS_EMAILS.operator, RLS_IDS.operator);
    admin = await createUserClient(RLS_EMAILS.admin, RLS_IDS.admin);
    customerA = await createUserClient(RLS_EMAILS.customerA, RLS_IDS.customerA);
  } catch (error) {
    if (error instanceof LocalSupabaseConfigError) {
      throw error;
    }
    const message = error instanceof MissingFixtureError ? error.message : String(error);
    return [blocked("S0", `Нет пользователей operator/admin/A. ${message}`)];
  }

  const hiddenProduct = await operator
    .from("products")
    .select("id")
    .eq("id", RLS_IDS.productOff);

  if (!includesId(hiddenProduct.data, RLS_IDS.productOff)) {
    return [
      blocked(
        "S0",
        "Сотрудник не видит неактивный товар. Нужны фикстуры seed.sql и роль operator в profiles.",
      ),
    ];
  }

  const results: RlsOutcome[] = [];

  results.push(
    await runCheck("S1", async () => {
      const asOperator = await operator
        .from("products")
        .select("id")
        .in("id", [
          RLS_IDS.productPub,
          RLS_IDS.productOff,
          RLS_IDS.productBrandHid,
          RLS_IDS.productCatHid,
        ]);
      const asAdmin = await admin
        .from("products")
        .select("id")
        .in("id", [
          RLS_IDS.productPub,
          RLS_IDS.productOff,
          RLS_IDS.productBrandHid,
          RLS_IDS.productCatHid,
        ]);
      const asCustomer = await customerA
        .from("products")
        .select("id")
        .in("id", [
          RLS_IDS.productPub,
          RLS_IDS.productOff,
          RLS_IDS.productBrandHid,
          RLS_IDS.productCatHid,
        ]);

      if (asOperator.error) {
        return failed("S1", asOperator.error.message);
      }
      if (asAdmin.error) {
        return failed("S1", asAdmin.error.message);
      }

      const operatorIds = idsOf(asOperator.data).sort().join(",");
      const adminIds = idsOf(asAdmin.data).sort().join(",");
      const expected = [
        RLS_IDS.productPub,
        RLS_IDS.productOff,
        RLS_IDS.productBrandHid,
        RLS_IDS.productCatHid,
      ]
        .sort()
        .join(",");

      if (operatorIds !== expected || adminIds !== expected) {
        return failed("S1", "operator или admin не видят полный набор тестовых товаров.");
      }
      if ((asCustomer.data ?? []).length !== 1 || !includesId(asCustomer.data, RLS_IDS.productPub)) {
        return failed("S1", "Покупатель увидел скрытые товары или не увидел публичный.");
      }
      return passed(
        "S1",
        "operator и admin видят скрытый каталог одинаково; покупатель видит только публичный товар.",
      );
    }),
  );

  results.push(
    await runCheck("S2", async () => {
      const operatorInsert = await operator
        .from("brands")
        .insert({
          id: RLS_IDS.brandRuntimeOperator,
          name: "rls-test-runtime-operator-brand",
          slug: "rls-test-runtime-operator-brand",
          is_published: false,
        })
        .select("id");
      const adminInsert = await admin
        .from("brands")
        .insert({
          id: RLS_IDS.brandRuntimeAdmin,
          name: "rls-test-runtime-admin-brand",
          slug: "rls-test-runtime-admin-brand",
          is_published: false,
        })
        .select("id");

      const operatorRow = await operator
        .from("brands")
        .select("id, name")
        .eq("id", RLS_IDS.brandRuntimeOperator);
      const adminRow = await admin
        .from("brands")
        .select("id, name")
        .eq("id", RLS_IDS.brandRuntimeAdmin);
      const seedBrand = await operator
        .from("brands")
        .select("id, slug")
        .eq("id", RLS_IDS.brandPub)
        .maybeSingle();

      if (operatorInsert.error || !includesId(operatorRow.data, RLS_IDS.brandRuntimeOperator)) {
        return failed("S2", `operator не создал бренд: ${operatorInsert.error?.message ?? "нет строки"}`);
      }
      if (adminInsert.error || !includesId(adminRow.data, RLS_IDS.brandRuntimeAdmin)) {
        return failed("S2", `admin не создал бренд: ${adminInsert.error?.message ?? "нет строки"}`);
      }
      if (seedBrand.data?.slug !== "rls-test-brand-pub") {
        return failed("S2", "Изменился посевной бренд.");
      }

      await operator.from("brands").delete().eq("id", RLS_IDS.brandRuntimeOperator);
      await admin.from("brands").delete().eq("id", RLS_IDS.brandRuntimeAdmin);

      return passed("S2", "operator и admin создают бренды; посевная строка не затронута.");
    }),
  );

  results.push(
    await runCheck("S3", async () => {
      const inventory = await operator
        .from("inventory")
        .select("product_id")
        .eq("product_id", RLS_IDS.productPub);
      const orders = await operator
        .from("orders")
        .select("id")
        .in("id", [RLS_IDS.orderA, RLS_IDS.orderB]);
      const comments = await operator
        .from("order_comments")
        .select("id")
        .in("id", [RLS_IDS.commentACustomer, RLS_IDS.commentAInternal, RLS_IDS.commentBCustomer]);
      const payments = await operator
        .from("payments")
        .select("id")
        .in("id", [RLS_IDS.paymentA, RLS_IDS.paymentB]);
      const adminPayments = await admin
        .from("payments")
        .select("id")
        .in("id", [RLS_IDS.paymentA, RLS_IDS.paymentB]);

      if (inventory.error || (inventory.data ?? []).length !== 1) {
        return blocked("S3", `Нет остатка на публичном товаре: ${inventory.error?.message ?? "0 строк"}`);
      }
      if (idsOf(orders.data).length !== 2) {
        return blocked("S3", "Сотрудник не видит оба заказа — нет фикстур заказов.");
      }
      if (!includesId(comments.data, RLS_IDS.commentAInternal)) {
        return failed("S3", "Сотрудник не видит внутренний комментарий.");
      }
      if (idsOf(payments.data).length !== 2 || idsOf(adminPayments.data).length !== 2) {
        return failed("S3", "operator или admin не читают оба платежа.");
      }
      return passed("S3", "Сотрудник читает склад, оба заказа, внутренние комментарии и платежи.");
    }),
  );

  results.push(
    await runCheck("S4", async () => {
      const carts = await operator
        .from("carts")
        .select("id")
        .in("id", [RLS_IDS.cartA, RLS_IDS.cartB]);
      const addresses = await operator
        .from("addresses")
        .select("id")
        .in("id", [RLS_IDS.addressA, RLS_IDS.addressB]);
      const adminCarts = await admin
        .from("carts")
        .select("id")
        .in("id", [RLS_IDS.cartA, RLS_IDS.cartB]);

      if (includesId(carts.data, RLS_IDS.cartA) || includesId(carts.data, RLS_IDS.cartB)) {
        return failed("S4", "operator прочитал чужие корзины.");
      }
      if (includesId(adminCarts.data, RLS_IDS.cartA) || includesId(adminCarts.data, RLS_IDS.cartB)) {
        return failed("S4", "admin прочитал чужие корзины.");
      }
      if (includesId(addresses.data, RLS_IDS.addressA) || includesId(addresses.data, RLS_IDS.addressB)) {
        return failed("S4", "operator прочитал чужие адреса.");
      }

      const ownerCart = await customerA.from("carts").select("id").eq("id", RLS_IDS.cartA);
      const ownerAddress = await customerA.from("addresses").select("id").eq("id", RLS_IDS.addressA);
      if (!includesId(ownerCart.data, RLS_IDS.cartA) || !includesId(ownerAddress.data, RLS_IDS.addressA)) {
        return blocked("S4", "У A нет корзины или адреса — нельзя подтвердить, что строки живы.");
      }
      return passed("S4", "Сотрудник не видит корзины и адреса; у A они на месте.");
    }),
  );

  results.push(
    await runCheck("S5", async () => {
      const cartInsert = await operator
        .from("cart_items")
        .insert({
          id: RLS_IDS.cartItemDenied,
          cart_id: RLS_IDS.cartA,
          product_id: RLS_IDS.productPub,
          quantity: 1,
        })
        .select("id");
      const addressInsert = await operator
        .from("addresses")
        .insert({
          id: RLS_IDS.addressDenied,
          user_id: RLS_IDS.customerA,
          recipient_name: "rls-test-staff-denied",
          phone: "+79990000098",
          country_code: "RU",
          city: "rls-test-denied-city",
          address_line1: "rls-test-denied-line",
        })
        .select("id");

      const extraItem = await customerA
        .from("cart_items")
        .select("id")
        .eq("id", RLS_IDS.cartItemDenied);
      const extraAddress = await customerA
        .from("addresses")
        .select("id")
        .eq("id", RLS_IDS.addressDenied);

      if (writeReturnedRow(cartInsert) || includesId(extraItem.data, RLS_IDS.cartItemDenied)) {
        return failed("S5", "operator добавил позицию в корзину A.");
      }
      if (writeReturnedRow(addressInsert) || includesId(extraAddress.data, RLS_IDS.addressDenied)) {
        return failed("S5", "operator создал адрес для A.");
      }
      return passed("S5", "Сотрудник не пишет в корзину и адреса покупателя.");
    }),
  );

  results.push(
    await runCheck("S6", async () => {
      const orderInsert = await operator
        .from("orders")
        .insert({
          id: RLS_IDS.orderDenied,
          order_number: "RLS-TEST-ORD-STAFF",
          customer_id: RLS_IDS.customerA,
          status: "new",
          payment_status: "pending",
          currency: "RUB",
          subtotal: 10.0,
          delivery_fee: 0.0,
          discount: 0.0,
          total_amount: 10.0,
          contact_name: "rls-test-staff",
          contact_phone: "+79990000097",
          shipping_country_code: "RU",
          shipping_city: "rls-test-city-a",
          shipping_address_line1: "rls-test-address-a-1",
        })
        .select("id");
      const inventoryUpdate = await operator
        .from("inventory")
        .update({ quantity_on_hand: 99 })
        .eq("product_id", RLS_IDS.productPub)
        .select("product_id, quantity_on_hand");
      const paymentInsert = await operator
        .from("payments")
        .insert({
          id: RLS_IDS.paymentDenied,
          order_id: RLS_IDS.orderA,
          provider: "rls-test-provider",
          provider_payment_id: "rls-test-pay-staff",
          status: "paid",
          amount: 1.0,
          currency: "RUB",
        })
        .select("id");
      const commentInsert = await operator
        .from("order_comments")
        .insert({
          id: RLS_IDS.commentDenied,
          order_id: RLS_IDS.orderA,
          author_id: RLS_IDS.operator,
          visibility: "internal",
          body: "rls-test-staff-comment",
        })
        .select("id");

      const deniedOrder = await admin.from("orders").select("id").eq("id", RLS_IDS.orderDenied);
      const inventoryAfter = await operator
        .from("inventory")
        .select("quantity_on_hand")
        .eq("product_id", RLS_IDS.productPub)
        .maybeSingle();
      const deniedPayment = await admin
        .from("payments")
        .select("id")
        .eq("id", RLS_IDS.paymentDenied);
      const deniedComment = await admin
        .from("order_comments")
        .select("id")
        .eq("id", RLS_IDS.commentDenied);

      if (writeReturnedRow(orderInsert) || includesId(deniedOrder.data, RLS_IDS.orderDenied)) {
        return failed("S6", "Сотрудник создал заказ через клиентский API.");
      }
      if (!writeDidNotApply(inventoryUpdate) || inventoryAfter.data?.quantity_on_hand !== 10) {
        return failed(
          "S6",
          `Остаток изменился: ${inventoryAfter.data?.quantity_on_hand ?? "нет строки"}`,
        );
      }
      if (writeReturnedRow(paymentInsert) || includesId(deniedPayment.data, RLS_IDS.paymentDenied)) {
        return failed("S6", "Сотрудник создал платёж через клиентский API.");
      }
      if (writeReturnedRow(commentInsert) || includesId(deniedComment.data, RLS_IDS.commentDenied)) {
        return failed("S6", "Сотрудник создал комментарий через клиентский API.");
      }
      return passed(
        "S6",
        "Через клиентский API сотрудник не пишет заказы, остатки, платежи и комментарии.",
      );
    }),
  );

  results.push(
    await runCheck("S7", async () => {
      const insertResult = await customerA
        .from("brands")
        .insert({
          id: RLS_IDS.brandDeniedCustomer,
          name: "rls-test-denied-customer-brand",
          slug: "rls-test-denied-customer-brand",
          is_published: true,
        })
        .select("id");

      const asStaff = await operator
        .from("brands")
        .select("id")
        .eq("id", RLS_IDS.brandDeniedCustomer);

      if (writeReturnedRow(insertResult) || includesId(asStaff.data, RLS_IDS.brandDeniedCustomer)) {
        return failed("S7", "Покупатель создал бренд.");
      }
      return passed("S7", "Покупатель не создаёт бренд; сотрудник подтверждает отсутствие строки.");
    }),
  );

  return results;
}
