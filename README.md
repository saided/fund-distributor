# 💰 Fund Distributor

A TypeScript CLI tool that distributes funds from a single source account ($10,000.00)
across up to three target accounts — with support for even splits and custom allocations.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [How We Understood the Problem](#-how-we-understood-the-problem)
- [Design Decisions](#-design-decisions)
- [Project Structure](#-project-structure)
- [Prerequisites and Installation](#-prerequisites-and-installation)
- [How to Run](#-how-to-run)
- [Usage Examples](#-usage-examples)
- [Error Handling](#-error-handling)
- [Running Tests](#-running-tests)

---

## 📖 Project Overview

| Detail | Value |
|---|---|
| Source Account Balance | **$10,000.00** |
| Target Accounts | **3** (target-001, target-002, target-003) |
| Distribution Modes | **Even** and **Custom** |
| Interface | **Command Line (CLI)** |

- **Even mode** — splits balance equally across selected targets
- **Custom mode** — sends specific amounts to specific targets
- Unallocated funds always remain in the source account

---

## 🧠 How We Understood the Problem

The problem has two core requirements:

**Requirement 1 — Distribute evenly across all targets:**
```
$10,000 ÷ 3 = $3,333.34 + $3,333.33 + $3,333.33
Source remaining → $0.00
```

**Requirement 2 — Distribute to a combination of targets:**
```
Even subset:    target-001 + target-003 → $5,000.00 each
Custom amount:  target-001=$3,000 + target-002=$4,000 → $3,000 remains in source
```

---

## 💡 Design Decisions

**1. Integer Cents Instead of Decimal Dollars**
All values are stored as cents (e.g. $10,000 = `1000000`) to avoid floating point errors:
```
// ❌ Decimal — loses a penny
3333.33 * 3 = 9999.989999...

// ✅ Integer cents — exact
333334 + 333333 + 333333 = 1000000 ✅
```

**2. Discriminated Union for Request Types**
TypeScript enforces the correct shape per mode at compile time:
- `EvenRequest` — targets are optional (defaults to all 3)
- `CustomRequest` — allocations record is required

**3. Targets Optional in Even Mode**
If no targets are provided, the function defaults to all 3 automatically.

**4. Targets Inferred in Custom Mode**
No separate targets array needed — targets are inferred from the keys of the allocations record.

**5. Remainder Handling**
Leftover cents from even division go to the first target:
```
$10,000 ÷ 3 → base = $3,333.33, remainder = $0.01
target-001 → $3,333.34  (base + remainder)
target-002 → $3,333.33
target-003 → $3,333.33
```

**6. Duplicate Detection at CLI Layer**
Since a JavaScript Record cannot have duplicate keys, duplicates are caught
at the CLI layer before building the allocations record.

---

## 📁 Project Structure

```
fund-distributor/
├── src/
│   ├── distributor.ts        # Core logic — types, validation, calculation
│   └── index.ts              # CLI entry point — arg parsing and display
├── tests/
│   └── distributor.test.ts   # 18 Jest unit tests
├── jest.config.ts            # Jest configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Scripts and dependencies
└── README.md
```

---

## ✅ Prerequisites and Installation

**Requirements:** Node.js v16+ and npm v8+

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/fund-distributor.git

# 2. Navigate into the project
cd fund-distributor

# 3. Install dependencies
npm install
```

---

## ▶️ How to Run

```bash
npm start <mode> [arguments]
```

| Mode | Arguments | Description |
|---|---|---|
| `even` | none | Split evenly across all 3 targets |
| `even` | `target-001 target-003` | Split evenly across selected targets |
| `custom` | `target-001=300000` | Send specific amounts in cents |

---

## 📋 Usage Examples

**Even — all 3 targets (default):**
```bash
npm start even
```
```
===== Distribution Result =====
  target-001 → $3,333.34
  target-002 → $3,333.33
  target-003 → $3,333.33
  Source remaining → $0.00
================================
```

**Even — subset of targets:**
```bash
npm start even target-001 target-003
```
```
===== Distribution Result =====
  target-001 → $5,000.00
  target-003 → $5,000.00
  Source remaining → $0.00
================================
```

**Custom — 2 targets, remainder stays in source:**
```bash
npm start custom target-001=300000 target-002=400000
```
```
===== Distribution Result =====
  target-001 → $3,000.00
  target-002 → $4,000.00
  Source remaining → $3,000.00
================================
```

**Custom — all 3 targets:**
```bash
npm start custom target-001=300000 target-002=400000 target-003=300000
```
```
===== Distribution Result =====
  target-001 → $3,000.00
  target-002 → $4,000.00
  target-003 → $3,000.00
  Source remaining → $0.00
================================
```

> 💡 All amounts are in cents. `300000` = $3,000.00

---

## ⚠️ Error Handling

| Scenario | Error Message |
|---|---|
| No mode specified | `Please specify a mode — 'even' or 'custom'` |
| Unknown target ID | `Invalid target account ID: "target-999".` |
| Duplicate targets | `Duplicate target IDs are not allowed.` |
| Empty targets array | `At least provide one target.` |
| No custom allocations | `Custom mode requires at least one allocation.` |
| Zero or negative amount | `Each amount must be greater than zero.` |
| Total exceeds balance | `Sum of amounts cannot exceed source balance.` |

---

## 🧪 Running Tests

```bash
npm test
```

```
PASS tests/distributor.test.ts
  distributeFunds
    Even Mode
      Validation
        ✓ should throw if targets is an empty array
        ✓ should throw if more than 3 targets provided
        ✓ should throw if unknown target ID provided
        ✓ should throw if duplicate target IDs provided
      Calculation
        ✓ should split $10,000 evenly across all 3 targets
        ✓ should default to all 3 targets if none provided
        ✓ should split evenly across subset of 2 targets
        ✓ should send full balance to single target
        ✓ total distributed should always equal source balance
    Custom Mode
      Validation
        ✓ should throw if allocations are empty
        ✓ should throw if invalid account ID provided
        ✓ should throw if amount is zero
        ✓ should throw if amount is negative
        ✓ should throw if total exceeds source balance
      Calculation
        ✓ should allocate to 1 target and keep rest in source
        ✓ should allocate to 2 targets and keep rest in source
        ✓ should allocate to all 3 targets with zero remaining
        ✓ source balance should reduce by exact allocated amount

Tests:  18 passed, 18 total
```

---

