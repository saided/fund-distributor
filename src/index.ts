/**
 * CLI entry point for the fund distributor.
 *
 * Usage:
 *   Even mode (all 3):        npm start even
 *   Even mode (subset):       npm start even target-001 target-003
 *   Custom mode:              npm start custom target-001=300000 target-002=400000
 */

import {
  distributeFunds,
  SOURCE_ACCOUNT,
  TARGETS_BY_ID,
  AccountId,
  Cents,
} from "./distributor";

//  Helpers 

function centsToDollars(cents: Cents): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function printResult(sourceBalance: Cents, distributions: { accountId: AccountId; amount: Cents }[]): void {
  console.log("\n===== Distribution Result =====");
  distributions.forEach(({ accountId, amount }) => {
    console.log(`  ${accountId} : ${centsToDollars(amount)}`);
  });
  console.log(`  Source remaining : ${centsToDollars(sourceBalance)}`);
  console.log("================================\n");
}

function printUsage(): void {
  console.log(`
Usage:
  Even mode (all 3 targets):   npm start even
  Even mode (subset):          npm start even target-001 target-003
  Custom mode:                 npm start custom target-001=300000 target-002=400000

Notes:
  - All amounts are in cents (e.g. 300000 = $3,000.00)
  - Valid target IDs: target-001, target-002, target-003
  `);
}

// Argument Parsing 

const args = process.argv.slice(2);  // removes the "node" and "index.ts"
const mode = args[0];                // "even" or "custom" modes
const rest = args.slice(1);          // rest data after mode

if (!mode || (mode !== "even" && mode !== "custom")) {
  console.error("Error: Please specify a mode — 'even' or 'custom'");
  printUsage();
  process.exit(1);
}

//  Fresh copies to avoid mutation 

const source = { ...SOURCE_ACCOUNT };
const targetsById = {
  "target-001": { ...TARGETS_BY_ID["target-001"] },
  "target-002": { ...TARGETS_BY_ID["target-002"] },
  "target-003": { ...TARGETS_BY_ID["target-003"] },
};

//  Run Distribution 

try {
  if (mode === "even") {
    // parse optional target IDs
    const targets = rest.length > 0 ? rest as AccountId[] : undefined;

    const result = distributeFunds(source, targetsById, {
      mode: "even",
      targets,
    });

    printResult(result.sourceBalance, result.distributions);

  } else {
    // parse "target-001=300000" pairs
    if (rest.length === 0) {
      console.error("Error: Custom mode requires at least one allocation (e.g. target-001=300000)");
      printUsage();
      process.exit(1);
    }

    // check for duplicate keys in CLI tokens
    const keys = rest.map(arg => arg.split("=")[0]);
    const uniqueKeys = new Set(keys);
    if (uniqueKeys.size !== keys.length) {
      console.error("Error: Duplicate target IDs are not allowed.");
      process.exit(1);
    }

    // build allocations record
    const allocationsByTargetCents: Partial<Record<AccountId, Cents>> = {};
    for (const arg of rest) {
      const [key, valueStr] = arg.split("=");
      if (!key || valueStr === undefined) {
        console.error(`Error: Invalid format "${arg}". Expected format: target-001=300000`);
        process.exit(1);
      }
      const amount = parseInt(valueStr, 10);
      if (isNaN(amount)) {
        console.error(`Error: Invalid amount "${valueStr}" for "${key}". Must be a whole number in cents.`);
        process.exit(1);
      }
      allocationsByTargetCents[key as AccountId] = amount;
    }

    const result = distributeFunds(source, targetsById, {
      mode: "custom",
      allocationsByTargetCents,
    });

    printResult(result.sourceBalance, result.distributions);
  }

} catch (err: any) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}