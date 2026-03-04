/**
 Core logic for distributing funds from a source account to target accounts.
 */


export type AccountId =  "target-001" | "target-002" | "target-003";
export type Cents = number;
export type Mode = "even" | "custom";


 export interface Account{
    id: String,
    balance: Cents
 }

export type EvenRequest = {
  mode: "even";
  targets?: AccountId[];        // optional → defaults to all 3
};

export type CustomRequest = {
  mode: "custom";
  allocationsByTargetCents: Partial<Record<AccountId, Cents>>;  // infer targets from keys
};

export type DistributionRequest = EvenRequest | CustomRequest;

export interface DistributionResult {
  sourceBalance: Cents;
  distributions: {
    accountId: AccountId;
    amount: Cents;
  }[];
}
export const SOURCE_ACCOUNT: Account = {
  id: "SOURCE",
  balance: 1000000   // $10,000.00 in cents
};

export const TARGETS_BY_ID: Record<AccountId, Account> = {
  "target-001": { id: "target-001", balance: 0 },
  "target-002": { id: "target-002", balance: 0 },
  "target-003": { id: "target-003", balance: 0 },
};


export function distributeFunds(
    source: Account,
    targetsById: Record<AccountId, Account>,
    req: DistributionRequest
): DistributionResult {
    //Actual Logic
    if (req.mode === "even") {
  const targets: AccountId[] = req.targets ?? 
    ["target-001", "target-002", "target-003"];

  if (req.targets !== undefined && req.targets.length === 0) {
    throw new Error("At least provide one target");
  }
  if (targets.length > 3) {
    throw new Error("Number of targets cannot exceed 3.");
  }

  const validIds: AccountId[] = ["target-001", "target-002", "target-003"];
  for (const id of targets) {
    if (!validIds.includes(id)) {
      throw new Error(`Invalid target account ID: "${id}".`);
    }
    if (!targetsById[id]) {
      throw new Error(`Target not found in targetsById: "${id}".`);
    }
  }

  if (new Set(targets).size !== targets.length) {
    throw new Error("Duplicate target IDs are not allowed.");
  }

  const totalCents = source.balance;   // integer cents
  const n = targets.length;
  const base = Math.floor(totalCents / n);  // base cents per target
  const rem = totalCents % n;               // leftover cents

  const distributions: { accountId: AccountId; amount: Cents }[] = [];

  for (let i = 0; i < n; i++) {
    const amount = base + (i < rem ? 1 : 0); // first rem targets get +1 cent
    targetsById[targets[i]].balance += amount;
    distributions.push({ accountId: targets[i], amount });
  }

  source.balance -= totalCents;  // source becomes 0

  return {
    sourceBalance: source.balance,
    distributions
  };
}


    return {} as DistributionResult;
    
};
