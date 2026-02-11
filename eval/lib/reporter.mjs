/**
 * Simple console reporter for eval results.
 *
 * - Passing scenarios: single summary line.
 * - Failing scenarios: expanded view of each failed criterion.
 */

/**
 * Print the format-validation stage results.
 */
export function reportFormatStage(formatResult) {
  console.log("\nStage 1: Format Validation");
  const total = formatResult.passed + formatResult.failed;
  if (formatResult.ok) {
    console.log(`  PASS  ${formatResult.passed}/${total} checks`);
  } else {
    console.log(`  FAIL  ${formatResult.passed}/${total} checks`);
  }
}

/**
 * Print the E2E testing stage results.
 */
export function reportE2EStage({ scenarios }) {
  console.log("\nStage 3: E2E Testing\n");

  let totalPass = 0;
  let totalFail = 0;
  let totalSkip = 0;

  for (const entry of scenarios) {
    if (entry.status === "SKIP") {
      totalSkip += 1;
      console.log(`  SKIP  ${entry.scenario}  — ${entry.reason}`);
      continue;
    }

    if (entry.status === "ERROR") {
      totalFail += 1;
      console.log(`  ERROR ${entry.scenario}  — ${entry.reason}`);
      continue;
    }

    totalPass += entry.passed;
    totalFail += entry.failed;

    if (entry.failed === 0) {
      console.log(
        `  PASS  ${entry.scenario}  ${entry.passed}/${entry.total} tests`
      );
    } else {
      console.log(
        `  FAIL  ${entry.scenario}  ${entry.passed}/${entry.total} tests`
      );
      for (const err of entry.errors || []) {
        console.log(`    ✗ ${err.split("\n")[0]}`);
      }
    }
  }

  const total = totalPass + totalFail;
  const pct = total > 0 ? ((totalPass / total) * 100).toFixed(1) : "0.0";
  console.log(
    `\nE2E Summary: ${totalPass} passed, ${totalFail} failed, ${totalSkip} skipped (${pct}%)`
  );
}

/**
 * Print the LLM evaluation stage results.
 */
export function reportLLMStage({ studentLabel, scenarios }) {
  console.log(`\nStage 2: LLM Evaluation (student: ${studentLabel})\n`);

  let totalPass = 0;
  let totalFail = 0;
  let scenariosPassCount = 0;
  let scenariosFailCount = 0;

  for (const { scenario, results } of scenarios) {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    totalPass += passed;
    totalFail += failed;

    if (failed === 0) {
      scenariosPassCount += 1;
      console.log(`  PASS  ${scenario}  ${passed}/${results.length}`);
    } else {
      scenariosFailCount += 1;
      console.log(`  FAIL  ${scenario}  ${passed}/${results.length}`);
      for (const r of results) {
        if (!r.pass) {
          console.log(`    \u2717 ${r.criterion}`);
          console.log(`      \u2192 "${r.reasoning}"`);
        }
      }
    }
  }

  const total = totalPass + totalFail;
  const pct = total > 0 ? ((totalPass / total) * 100).toFixed(1) : "0.0";
  console.log(
    `\nSummary: ${scenariosPassCount} passed, ${scenariosFailCount} failed (${totalPass}/${total} criteria, ${pct}%)`
  );
}
