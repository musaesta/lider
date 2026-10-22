import { assertLocalSupabaseConfig, type RlsOutcome } from "./helpers.ts";
import { runCartsAddressesRlsTests } from "./carts-addresses.test.ts";
import { runCatalogRlsTests } from "./catalog.test.ts";
import { runOrdersRlsTests } from "./orders.test.ts";
import { runRolesRlsTests } from "./roles.test.ts";
import { runStaffRlsTests } from "./staff.test.ts";

/**
 * Раннер локальных RLS-тестов. Не запускать без отдельного разрешения.
 *
 * Из корня проекта, Node 24, без новых пакетов:
 * node --experimental-strip-types tests/rls/run.ts
 *
 * blocked и failed дают ненулевой код выхода.
 */
const suites: Array<{ name: string; run: () => Promise<RlsOutcome[]> }> = [
  { name: "catalog", run: runCatalogRlsTests },
  { name: "carts-addresses", run: runCartsAddressesRlsTests },
  { name: "roles", run: runRolesRlsTests },
  { name: "orders", run: runOrdersRlsTests },
  { name: "staff", run: runStaffRlsTests },
];

function printOutcome(suite: string, outcome: RlsOutcome) {
  console.log(`${suite}\t${outcome.id}\t${outcome.status}\t${outcome.message}`);
}

async function main() {
  assertLocalSupabaseConfig();

  if (!process.env.RLS_TEST_PASSWORD) {
    console.error(
      "blocked\tНет RLS_TEST_PASSWORD. Пользователи и пароли в исходники не записываются.",
    );
    process.exitCode = 1;
    return;
  }

  let failed = 0;
  let blocked = 0;
  let passed = 0;

  for (const suite of suites) {
    const results = await suite.run();

    if (results.length === 0) {
      console.error(`${suite.name}\tUNEXPECTED\tfailed\tНабор не вернул результатов.`);
      failed += 1;
      continue;
    }

    for (const outcome of results) {
      printOutcome(suite.name, outcome);

      if (outcome.status === "passed") {
        passed += 1;
      } else if (outcome.status === "blocked") {
        blocked += 1;
      } else {
        failed += 1;
      }
    }
  }

  console.log(`итог\tpassed=${passed}\tfailed=${failed}\tblocked=${blocked}`);

  if (failed > 0 || blocked > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Неожиданная ошибка запуска.";
  console.error(`run\tUNEXPECTED\tfailed\t${message}`);
  process.exitCode = 1;
});
