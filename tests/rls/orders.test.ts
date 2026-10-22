import {
  LocalSupabaseConfigError,
  MissingFixtureError,
  RLS_EMAILS,
  RLS_IDS,
  blocked,
  createUserClient,
  failed,
  includesId,
  idsOf,
  passed,
  runCheck,
  writeDidNotApply,
  writeReturnedRow,
  type RlsOutcome,
} from "./helpers.ts";

/**
 * Заказы, комментарии и запрет прямой записи. Не запускается сам.
 * Позднее: после согласия на способ запуска вызвать runOrdersRlsTests().
 */
export async function runOrdersRlsTests(): Promise<RlsOutcome[]> {
  let customerA;
  let customerB;
  let operator;

  try {
    customerA = await createUserClient(RLS_EMAILS.customerA, RLS_IDS.customerA);
    customerB = await createUserClient(RLS_EMAILS.customerB, RLS_IDS.customerB);
    operator = await createUserClient(RLS_EMAILS.operator, RLS_IDS.operator);
  } catch (error) {
    if (error instanceof LocalSupabaseConfigError) {
      throw error;
    }
    const message = error instanceof MissingFixtureError ? error.message : String(error);
    return [blocked("O0", `Нет пользователей A/B/operator. ${message}`)];
  }

  const orderA = await customerA.from("orders").select("id").eq("id", RLS_IDS.orderA);
  const orderB = await customerB.from("orders").select("id").eq("id", RLS_IDS.orderB);

  if (!includesId(orderA.data, RLS_IDS.orderA) || !includesId(orderB.data, RLS_IDS.orderB)) {
    return [
      blocked(
        "O0",
        "Нет заказов ORD_A/ORD_B. Нужны пользователи с фиксированными UUID и секция заказов в seed.sql.",
      ),
    ];
  }

  const results: RlsOutcome[] = [];

  results.push(
    await runCheck("O1", async () => {
      const { data, error } = await customerA
        .from("orders")
        .select("id")
        .in("id", [RLS_IDS.orderA, RLS_IDS.orderB]);

      if (error) {
        return failed("O1", error.message);
      }
      if (!includesId(data, RLS_IDS.orderA) || includesId(data, RLS_IDS.orderB)) {
        return failed("O1", "A видит чужой заказ или не видит свой.");
      }

      const stillB = await customerB.from("orders").select("id").eq("id", RLS_IDS.orderB);
      if (!includesId(stillB.data, RLS_IDS.orderB)) {
        return failed("O1", "Заказ B пропал.");
      }
      return passed("O1", "A читает только свой заказ; заказ B на месте.");
    }),
  );

  results.push(
    await runCheck("O2", async () => {
      const { data, error } = await customerA
        .from("order_items")
        .select("id")
        .in("id", [RLS_IDS.orderItemA, RLS_IDS.orderItemB]);

      if (error) {
        return failed("O2", error.message);
      }
      if (!includesId(data, RLS_IDS.orderItemA) || includesId(data, RLS_IDS.orderItemB)) {
        return failed("O2", "Изоляция позиций заказа нарушена.");
      }
      return passed("O2", "A видит только позиции своего заказа.");
    }),
  );

  results.push(
    await runCheck("O3", async () => {
      const { data, error } = await customerA
        .from("order_status_history")
        .select("id")
        .in("id", [RLS_IDS.orderHistoryA, RLS_IDS.orderHistoryB]);

      if (error) {
        return failed("O3", error.message);
      }
      if (!includesId(data, RLS_IDS.orderHistoryA) || includesId(data, RLS_IDS.orderHistoryB)) {
        return failed("O3", "Изоляция истории статусов нарушена.");
      }
      return passed("O3", "A видит только историю своего заказа.");
    }),
  );

  results.push(
    await runCheck("O4", async () => {
      const asCustomer = await customerA
        .from("payments")
        .select("id")
        .in("id", [RLS_IDS.paymentA, RLS_IDS.paymentB]);

      if (includesId(asCustomer.data, RLS_IDS.paymentA) || includesId(asCustomer.data, RLS_IDS.paymentB)) {
        return failed("O4", "Покупатель увидел платежи.");
      }

      const asStaff = await operator
        .from("payments")
        .select("id")
        .in("id", [RLS_IDS.paymentA, RLS_IDS.paymentB]);

      if (asStaff.error) {
        return failed("O4", `Сотрудник не прочитал платежи: ${asStaff.error.message}`);
      }
      const staffIds = idsOf(asStaff.data);
      if (!staffIds.includes(RLS_IDS.paymentA) || !staffIds.includes(RLS_IDS.paymentB)) {
        return blocked("O4", "Фикстуры платежей отсутствуют для сотрудника.");
      }
      return passed(
        "O4",
        "Покупатель не видит payments; сотрудник подтверждает, что платежи A и B в базе есть.",
      );
    }),
  );

  results.push(
    await runCheck("O5", async () => {
      const { data, error } = await customerA
        .from("order_comments")
        .select("id, visibility")
        .eq("order_id", RLS_IDS.orderA);

      if (error) {
        return failed("O5", error.message);
      }
      if (!includesId(data, RLS_IDS.commentACustomer)) {
        return failed("O5", "A не видит клиентский комментарий своего заказа.");
      }
      if (includesId(data, RLS_IDS.commentAInternal)) {
        return failed("O5", "A видит внутренний комментарий.");
      }

      const internal = await operator
        .from("order_comments")
        .select("id")
        .eq("id", RLS_IDS.commentAInternal);
      if (!includesId(internal.data, RLS_IDS.commentAInternal)) {
        return blocked("O5", "Фикстура внутреннего комментария отсутствует.");
      }
      return passed("O5", "A видит только visibility=customer по своему заказу.");
    }),
  );

  results.push(
    await runCheck("O6", async () => {
      const { data, error } = await customerA
        .from("order_comments")
        .select("id")
        .eq("order_id", RLS_IDS.orderB);

      if (error) {
        return failed("O6", error.message);
      }
      if (includesId(data, RLS_IDS.commentBCustomer)) {
        return failed("O6", "A видит комментарий заказа B.");
      }

      const stillB = await customerB
        .from("order_comments")
        .select("id")
        .eq("id", RLS_IDS.commentBCustomer);
      if (!includesId(stillB.data, RLS_IDS.commentBCustomer)) {
        return blocked("O6", "Комментарий заказа B отсутствует у владельца.");
      }
      return passed("O6", "A не видит комментарии заказа B.");
    }),
  );

  results.push(
    await runCheck("O7", async () => {
      const orderInsert = await customerA
        .from("orders")
        .insert({
          id: RLS_IDS.orderDenied,
          order_number: "RLS-TEST-ORD-DENIED",
          customer_id: RLS_IDS.customerA,
          status: "new",
          payment_status: "pending",
          currency: "RUB",
          subtotal: 10.0,
          delivery_fee: 0.0,
          discount: 0.0,
          total_amount: 10.0,
          contact_name: "rls-test-denied",
          contact_phone: "+79990000099",
          shipping_country_code: "RU",
          shipping_city: "rls-test-denied-city",
          shipping_address_line1: "rls-test-denied-line",
        })
        .select("id");

      const itemInsert = await customerA
        .from("order_items")
        .insert({
          id: RLS_IDS.orderItemDenied,
          order_id: RLS_IDS.orderA,
          product_id: RLS_IDS.productPub,
          sku_snapshot: "RLS-TEST-SKU-DENIED",
          name_snapshot: "rls-test-denied-item",
          unit_price: 1.0,
          quantity: 1,
        })
        .select("id");

      const historyInsert = await customerA
        .from("order_status_history")
        .insert({
          id: RLS_IDS.orderHistoryDenied,
          order_id: RLS_IDS.orderA,
          previous_status: "new",
          new_status: "confirmed",
          changed_by: RLS_IDS.customerA,
        })
        .select("id");

      const commentInsert = await customerA
        .from("order_comments")
        .insert({
          id: RLS_IDS.commentDenied,
          order_id: RLS_IDS.orderA,
          author_id: RLS_IDS.customerA,
          visibility: "customer",
          body: "rls-test-denied-comment",
        })
        .select("id");

      const paymentInsert = await customerA
        .from("payments")
        .insert({
          id: RLS_IDS.paymentDenied,
          order_id: RLS_IDS.orderA,
          provider: "rls-test-provider",
          provider_payment_id: "rls-test-pay-denied",
          status: "paid",
          amount: 1.0,
          currency: "RUB",
        })
        .select("id");

      const statusUpdate = await customerA
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", RLS_IDS.orderA)
        .select("id, status");

      const deniedOrder = await operator.from("orders").select("id").eq("id", RLS_IDS.orderDenied);
      const deniedItem = await operator
        .from("order_items")
        .select("id")
        .eq("id", RLS_IDS.orderItemDenied);
      const deniedHistory = await operator
        .from("order_status_history")
        .select("id")
        .eq("id", RLS_IDS.orderHistoryDenied);
      const deniedComment = await operator
        .from("order_comments")
        .select("id")
        .eq("id", RLS_IDS.commentDenied);
      const deniedPayment = await operator
        .from("payments")
        .select("id")
        .eq("id", RLS_IDS.paymentDenied);
      const orderAfter = await customerA
        .from("orders")
        .select("status")
        .eq("id", RLS_IDS.orderA)
        .maybeSingle();

      if (writeReturnedRow(orderInsert) || includesId(deniedOrder.data, RLS_IDS.orderDenied)) {
        return failed("O7", "A создал заказ через клиентский API.");
      }
      if (writeReturnedRow(itemInsert) || includesId(deniedItem.data, RLS_IDS.orderItemDenied)) {
        return failed("O7", "A создал позицию заказа.");
      }
      if (
        writeReturnedRow(historyInsert) ||
        includesId(deniedHistory.data, RLS_IDS.orderHistoryDenied)
      ) {
        return failed("O7", "A создал историю статусов.");
      }
      if (writeReturnedRow(commentInsert) || includesId(deniedComment.data, RLS_IDS.commentDenied)) {
        return failed("O7", "A создал комментарий.");
      }
      if (writeReturnedRow(paymentInsert) || includesId(deniedPayment.data, RLS_IDS.paymentDenied)) {
        return failed("O7", "A создал платёж.");
      }
      if (!writeDidNotApply(statusUpdate) || orderAfter.data?.status !== "new") {
        return failed("O7", `Статус заказа A изменился: ${orderAfter.data?.status ?? "нет строки"}`);
      }
      return passed(
        "O7",
        "A не создаёт и не меняет заказы, позиции, историю, комментарии и платежи. Статус ORD_A прежний.",
      );
    }),
  );

  return results;
}
