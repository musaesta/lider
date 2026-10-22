import {
  LocalSupabaseConfigError,
  MissingFixtureError,
  RLS_EMAILS,
  RLS_IDS,
  blocked,
  createUserClient,
  failed,
  includesId,
  isAccessDeniedError,
  passed,
  runCheck,
  writeDidNotApply,
  writeReturnedRow,
  type RlsOutcome,
} from "./helpers.ts";

/**
 * Запрет самоназначения роли. Не запускается сам.
 * Позднее: после согласия на способ запуска вызвать runRolesRlsTests().
 */
export async function runRolesRlsTests(): Promise<RlsOutcome[]> {
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
    return [blocked("R0", `Нет тестовых покупателей A/B. ${message}`)];
  }

  const profileA = await customerA
    .from("profiles")
    .select("id, role, display_name, phone")
    .eq("id", RLS_IDS.customerA)
    .maybeSingle();

  if (profileA.error || !profileA.data) {
    return [
      blocked(
        "R0",
        `Нет профиля A: ${profileA.error?.message ?? "пусто"}. Нужны пользователи и триггер profiles.`,
      ),
    ];
  }

  const originalName = profileA.data.display_name;
  const originalPhone = profileA.data.phone;
  const results: RlsOutcome[] = [];

  results.push(
    await runCheck("R1", async () => {
      const updateResult = await customerA
        .from("profiles")
        .update({
          display_name: "rls-test-customer-a-name",
          phone: "+79990000011",
        })
        .eq("id", RLS_IDS.customerA)
        .select("id, role, display_name, phone");

      const after = await customerA
        .from("profiles")
        .select("id, role, display_name, phone")
        .eq("id", RLS_IDS.customerA)
        .maybeSingle();

      if (updateResult.error || !after.data) {
        return failed("R1", updateResult.error?.message ?? "Профиль A не прочитан после update.");
      }
      if (after.data.role !== "customer") {
        return failed("R1", `После смены имени роль стала ${after.data.role}.`);
      }
      if (after.data.display_name !== "rls-test-customer-a-name") {
        return failed("R1", "display_name не обновился.");
      }

      await customerA
        .from("profiles")
        .update({
          display_name: originalName,
          phone: originalPhone,
        })
        .eq("id", RLS_IDS.customerA);

      return passed("R1", "A меняет имя и телефон; role остаётся customer.");
    }),
  );

  results.push(
    await runCheck("R2", async () => {
      const updateResult = await customerA
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", RLS_IDS.customerA)
        .select("id, role");

      const after = await customerA
        .from("profiles")
        .select("role")
        .eq("id", RLS_IDS.customerA)
        .maybeSingle();

      if (!writeDidNotApply(updateResult) && updateResult.data?.some((row) => row.role === "admin")) {
        return failed("R2", "A назначил себе admin.");
      }
      if (after.data?.role !== "customer") {
        return failed("R2", `role после попытки: ${after.data?.role ?? "нет строки"}.`);
      }
      return passed("R2", "A не назначил себе admin; роль в базе прежняя.");
    }),
  );

  results.push(
    await runCheck("R3", async () => {
      const updateResult = await customerA
        .from("profiles")
        .update({ role: "operator" })
        .eq("id", RLS_IDS.customerA)
        .select("id, role");

      const after = await customerA
        .from("profiles")
        .select("role")
        .eq("id", RLS_IDS.customerA)
        .maybeSingle();

      if (!writeDidNotApply(updateResult) && updateResult.data?.some((row) => row.role === "operator")) {
        return failed("R3", "A назначил себе operator.");
      }
      if (after.data?.role !== "customer") {
        return failed("R3", `role после попытки: ${after.data?.role ?? "нет строки"}.`);
      }
      return passed("R3", "A не назначил себе operator; роль в базе прежняя.");
    }),
  );

  results.push(
    await runCheck("R4", async () => {
      const beforeB = await customerB
        .from("profiles")
        .select("display_name, phone, role")
        .eq("id", RLS_IDS.customerB)
        .maybeSingle();

      if (!beforeB.data) {
        return blocked("R4", "Нет профиля B.");
      }

      const updateResult = await customerA
        .from("profiles")
        .update({ display_name: "rls-test-hijack-b" })
        .eq("id", RLS_IDS.customerB)
        .select("id");

      const afterB = await customerB
        .from("profiles")
        .select("display_name, phone, role")
        .eq("id", RLS_IDS.customerB)
        .maybeSingle();

      if (!writeDidNotApply(updateResult) && includesId(updateResult.data, RLS_IDS.customerB)) {
        return failed("R4", "A обновил профиль B.");
      }
      if (
        afterB.data?.display_name !== beforeB.data.display_name ||
        afterB.data?.phone !== beforeB.data.phone ||
        afterB.data?.role !== beforeB.data.role
      ) {
        return failed("R4", "Поля профиля B изменились.");
      }
      return passed("R4", "A не меняет профиль B.");
    }),
  );

  results.push(
    await runCheck("R5", async () => {
      const insertResult = await customerA
        .from("profiles")
        .insert({
          id: RLS_IDS.profileDenied,
          display_name: "rls-test-extra-profile",
          role: "admin",
        })
        .select("id");

      const extra = await customerA
        .from("profiles")
        .select("id")
        .eq("id", RLS_IDS.profileDenied);

      if (writeReturnedRow(insertResult) || includesId(extra.data, RLS_IDS.profileDenied)) {
        return failed("R5", "A создал дополнительный профиль.");
      }
      if (!writeDidNotApply(insertResult) || !isAccessDeniedError(insertResult.error)) {
        return blocked(
          "R5",
          "Вставка профиля не вернула явный отказ доступа. Без этого нельзя считать, что строки нет: покупатель чужой профиль не увидит.",
        );
      }
      return passed("R5", "A не вставляет строку в profiles: есть отказ доступа.");
    }),
  );

  return results;
}
